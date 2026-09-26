import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let rows;
  try {
    rows = await db.execute(`
      SELECT user_id, username, game,
             COUNT(*) as played,
             SUM(won) as wins,
             MIN(CASE WHEN won=1 THEN elapsed END) as best_time,
             AVG(elapsed) as avg_time,
             AVG(moves) as avg_moves
      FROM game_stats
      GROUP BY user_id, game
      ORDER BY wins DESC, played ASC
    `);
  } catch (e) {
    console.error("[ladder]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  type Entry = {
    userId: string; username: string; game: string;
    played: number; wins: number; winRate: number;
    bestTime: number | null; avgTime: number | null; avgMoves: number | null;
  };
  const byGame: Record<string, Entry[]> = {};
  const globalMap: Record<string, { userId: string; username: string; played: number; wins: number }> = {};

  for (const r of rows.rows) {
    const userId = r[0] as string;
    const username = r[1] as string;
    const game = r[2] as string;
    const played = Number(r[3]);
    const wins = Number(r[4]);
    const bestTime = r[5] != null ? Number(r[5]) : null;
    const avgTime = r[6] != null ? Math.round(Number(r[6])) : null;
    const avgMoves = r[7] != null ? Math.round(Number(r[7])) : null;

    if (!byGame[game]) byGame[game] = [];
    byGame[game].push({ userId, username, game, played, wins, winRate: played > 0 ? Math.round((wins / played) * 100) : 0, bestTime, avgTime, avgMoves });

    if (!globalMap[userId]) globalMap[userId] = { userId, username, played: 0, wins: 0 };
    globalMap[userId].played += played;
    globalMap[userId].wins += wins;
  }

  const global = Object.values(globalMap)
    .map(e => ({ ...e, winRate: e.played > 0 ? Math.round((e.wins / e.played) * 100) : 0, bestTime: null, avgTime: null, avgMoves: null }))
    .sort((a, b) => b.wins - a.wins || a.played - b.played);

  return NextResponse.json({ global, byGame });
}
