import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deserializeState, serializeState, sanitizeState, runAITurns, RoomPlayer } from "@/lib/rooms";
import { playCard, drawCards, pickColor, canPlay } from "@/lib/uno/game";
import { CardColor } from "@/lib/uno/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await params;
  const body = await req.json().catch(() => ({}));

  const roomRow = await db.execute({ sql: "SELECT status, game_state FROM game_rooms WHERE code = ?", args: [code] });
  if (!roomRow.rows.length) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (roomRow.rows[0][0] !== "playing") return NextResponse.json({ error: "Partie non démarrée" }, { status: 400 });

  const playersRow = await db.execute({
    sql: "SELECT user_id, username, player_index FROM room_players WHERE room_code = ? ORDER BY player_index",
    args: [code],
  });
  const players: RoomPlayer[] = playersRow.rows.map((r) => ({
    userId: r[0] as string, username: r[1] as string, playerIndex: r[2] as number,
  }));

  const me = players.find((p) => p.userId === user.id);
  if (!me) return NextResponse.json({ error: "Tu n'es pas dans cette partie" }, { status: 403 });

  let state = deserializeState(roomRow.rows[0][1] as string);

  if (state.currentPlayerIndex !== me.playerIndex) {
    return NextResponse.json({ error: "Ce n'est pas ton tour" }, { status: 400 });
  }

  const { type, cardId, color } = body;

  if (type === "play") {
    const card = state.players[me.playerIndex].hand.find((c) => c.id === cardId);
    if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 400 });
    if (!canPlay(card, state)) return NextResponse.json({ error: "Carte non jouable" }, { status: 400 });
    state = playCard(state, cardId, color as CardColor | undefined);
  } else if (type === "draw") {
    state = drawCards(state);
  } else if (type === "pickColor") {
    state = pickColor(state, color as CardColor);
  } else {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  state = runAITurns(state);

  const now = Date.now();
  const newStatus = state.phase === "won" ? "finished" : "playing";
  await db.execute({
    sql: "UPDATE game_rooms SET game_state = ?, status = ?, updated_at = ? WHERE code = ?",
    args: [serializeState(state), newStatus, now, code],
  });

  return NextResponse.json({ gameState: sanitizeState(state, me.playerIndex) });
}
