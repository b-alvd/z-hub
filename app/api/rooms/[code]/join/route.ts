import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT status, num_ai FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (roomRow.rows[0][0] !== "waiting") return NextResponse.json({ error: "Partie déjà commencée" }, { status: 400 });

  const alreadyIn = await db.execute({
    sql: "SELECT player_index FROM room_players WHERE room_code = ? AND user_id = ?",
    args: [code, user.id],
  });
  if (alreadyIn.rows.length) return NextResponse.json({ ok: true });

  const countRow = await db.execute({ sql: "SELECT COUNT(*) FROM room_players WHERE room_code = ?", args: [code] });
  const count = countRow.rows[0][0] as number;
  const numAI = roomRow.rows[0][1] as number;
  const maxHumans = 8 - numAI;
  if (count >= maxHumans) return NextResponse.json({ error: "Partie complète" }, { status: 400 });

  await db.execute({
    sql: "INSERT INTO room_players (room_code, user_id, username, player_index) VALUES (?, ?, ?, ?)",
    args: [code, user.id, user.username, count],
  });

  return NextResponse.json({ ok: true });
}
