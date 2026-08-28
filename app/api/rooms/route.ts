import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { generateCode } from "@/lib/rooms";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  await initDb();

  const { numAI = 0 } = await req.json().catch(() => ({}));

  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.execute({ sql: "SELECT code FROM game_rooms WHERE code = ?", args: [code] });
    if (!existing.rows.length) break;
    code = generateCode();
    attempts++;
  }

  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO game_rooms (code, host_id, status, num_ai, created_at, updated_at) VALUES (?, ?, 'waiting', ?, ?, ?)",
    args: [code, user.id, numAI, now, now],
  });
  await db.execute({
    sql: "INSERT INTO room_players (room_code, user_id, username, player_index) VALUES (?, ?, ?, 0)",
    args: [code, user.id, user.username],
  });

  return NextResponse.json({ code });
}
