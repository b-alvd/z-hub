import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deserializeState, sanitizeState, RoomPlayer } from "@/lib/rooms";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT * FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  const room = roomRow.rows[0];

  const playersRow = await db.execute({
    sql: "SELECT user_id, username, player_index FROM room_players WHERE room_code = ? ORDER BY player_index",
    args: [code],
  });
  const players: RoomPlayer[] = playersRow.rows.map((r) => ({
    userId: r[0] as string,
    username: r[1] as string,
    playerIndex: r[2] as number,
  }));

  const me = players.find((p) => p.userId === user.id);
  const myPlayerIndex = me?.playerIndex ?? -1;

  const gameState = room[4] ? sanitizeState(deserializeState(room[4] as string), myPlayerIndex) : null;

  return NextResponse.json({
    code,
    hostId: room[1] as string,
    status: room[2] as string,
    numAI: room[3] as number,
    players,
    myPlayerIndex,
    gameState,
    isHost: room[1] === user.id,
  });
}
