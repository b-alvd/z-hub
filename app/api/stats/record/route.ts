import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { game, won, elapsed = 0, moves = 0 } = await req.json().catch(() => ({}));
  if (!game) return NextResponse.json({ error: "game requis" }, { status: 400 });

  await db.execute({
    sql: "INSERT INTO game_stats (id, user_id, username, game, won, elapsed, moves, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [crypto.randomUUID(), user.id, user.username, game, won ? 1 : 0, Math.round(elapsed), Math.round(moves), Date.now()],
  });

  return NextResponse.json({ ok: true });
}
