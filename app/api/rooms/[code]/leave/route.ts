import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deserializeState, serializeState } from "@/lib/rooms";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT status, game_state FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

  const status = roomRow.rows[0][0] as string;
  if (status !== "playing") return NextResponse.json({ ok: true });

  const playersRow = await db.execute({
    sql: "SELECT user_id, player_index FROM room_players WHERE room_code = ? ORDER BY player_index",
    args: [code],
  });
  const me = playersRow.rows.find(r => r[0] === user.id);
  if (!me) return NextResponse.json({ ok: true });

  const quitterIdx = me[1] as number;

  let state = deserializeState(roomRow.rows[0][1] as string);

  if (!state.players[quitterIdx]) return NextResponse.json({ ok: true });

  // Mark player as left — they disappear from the board
  state.players[quitterIdx].left = true;
  state.lastAction = `${user.username} a quitté la partie`;

  // If it was their turn, advance to the next active player
  if (state.currentPlayerIndex === quitterIdx) {
    const n = state.players.length;
    let next = (quitterIdx + state.direction + n) % n;
    let safety = 0;
    while (state.players[next]?.left && next !== quitterIdx && safety < n) {
      next = (next + state.direction + n) % n;
      safety++;
    }
    state.currentPlayerIndex = next;
  }

  const now = Date.now();
  await db.execute({
    sql: "UPDATE game_rooms SET game_state = ?, updated_at = ? WHERE code = ?",
    args: [serializeState(state), now, code],
  });

  return NextResponse.json({ ok: true });
}
