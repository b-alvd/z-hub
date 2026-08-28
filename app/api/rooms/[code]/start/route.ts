import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { initMultiGame, serializeState, runAITurns } from "@/lib/rooms";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT host_id, status, num_ai FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  const [hostId, status, numAI] = roomRow.rows[0];
  if (hostId !== user.id) return NextResponse.json({ error: "Seul l'hôte peut lancer" }, { status: 403 });
  if (status !== "waiting") return NextResponse.json({ error: "Partie déjà commencée" }, { status: 400 });

  const playersRow = await db.execute({
    sql: "SELECT username FROM room_players WHERE room_code = ? ORDER BY player_index",
    args: [code],
  });
  const humanNames = playersRow.rows.map((r) => r[0] as string);

  let state = initMultiGame(humanNames, numAI as number);
  state = runAITurns(state);

  const now = Date.now();
  await db.execute({
    sql: "UPDATE game_rooms SET status = 'playing', game_state = ?, updated_at = ? WHERE code = ?",
    args: [serializeState(state), now, code],
  });

  return NextResponse.json({ ok: true });
}
