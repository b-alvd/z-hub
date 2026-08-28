import { GameState, CardColor } from "./uno/types";
import { initGame, aiPlay } from "./uno/game";

const AI_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "Gabriel"];

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function serializeState(state: GameState): string {
  return JSON.stringify({ ...state, unoCalledBy: Array.from(state.unoCalledBy) });
}

export function deserializeState(json: string): GameState {
  const data = JSON.parse(json);
  return { ...data, unoCalledBy: new Set<string>(data.unoCalledBy) };
}

export function initMultiGame(humanNames: string[], numAI: number): GameState {
  const aiNames = AI_NAMES.slice(0, numAI);
  const state = initGame([...humanNames, ...aiNames]);
  state.players.forEach((p, i) => { p.isAI = i >= humanNames.length; });
  return state;
}

export function runAITurns(state: GameState): GameState {
  let s = state;
  let safety = 0;
  while (s.phase === "playing" && s.players[s.currentPlayerIndex].isAI && safety < 30) {
    s = aiPlay(s);
    safety++;
  }
  return s;
}

export type RoomPlayer = { userId: string; username: string; playerIndex: number };

export function sanitizeState(state: GameState, myPlayerIndex: number) {
  return {
    ...state,
    unoCalledBy: Array.from(state.unoCalledBy),
    deck: state.deck.length,
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      isAI: p.isAI,
      handCount: p.hand.length,
      hand: i === myPlayerIndex ? p.hand : [],
    })),
  };
}
