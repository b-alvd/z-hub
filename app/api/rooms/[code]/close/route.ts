import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;

  const roomRow = await db.execute({ sql: "SELECT host_id FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (roomRow.rows[0][0] !== user.id) return NextResponse.json({ error: "Seul l'hôte peut fermer" }, { status: 403 });

  await db.execute({ sql: "DELETE FROM room_players WHERE room_code = ?", args: [code] });
  await db.execute({ sql: "DELETE FROM game_rooms WHERE code = ?", args: [code] });

  return NextResponse.json({ ok: true });
}
