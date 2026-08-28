import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deserializeState } from "@/lib/rooms";
import { GameState } from "@/lib/uno/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT status, game_state FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

  const status = roomRow.rows[0][0] as string;
  if (status !== "playing") return NextResponse.json({ ok: true });

  const rawState = roomRow.rows[0][1] as string;
  let state: GameState & { abandonedBy?: string };
  try {
    state = deserializeState(rawState) as GameState & { abandonedBy?: string };
  } catch {
    return NextResponse.json({ ok: true });
  }

  state.abandonedBy = user.username;

  const serialized = JSON.stringify({ ...state, unoCalledBy: Array.from(state.unoCalledBy) });
  const now = Date.now();
  await db.execute({
    sql: "UPDATE game_rooms SET status = 'abandoned', game_state = ?, updated_at = ? WHERE code = ?",
    args: [serialized, now, code],
  });

  return NextResponse.json({ ok: true });
}
