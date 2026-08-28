import { Card, CardColor, GameState, Player } from "./types";
import { createDeck, shuffle } from "./deck";

export function initGame(playerNames: string[]): GameState {
  const deck = createDeck();
  const players: Player[] = playerNames.map((name, i) => ({
    id: `p${i}`,
    name,
    hand: [],
    isAI: i > 0,
  }));

  // Deal 7 cards each
  for (let i = 0; i < 7; i++) {
    for (const p of players) {
      p.hand.push(deck.pop()!);
    }
  }

  // First card - skip wilds and wild4
  let firstCard: Card;
  do {
    firstCard = deck.pop()!;
    if (firstCard.color === "wild") deck.unshift(firstCard);
  } while (firstCard.color === "wild");

  return {
    deck,
    discardPile: [firstCard],
    players,
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: firstCard.color,
    phase: "playing",
    winner: null,
    pendingDrawCount: 0,
    lastAction: `La partie commence ! Carte de départ : ${label(firstCard)}`,
    unoCalledBy: new Set(),
  };
}

export function topCard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1];
}

export function canPlay(card: Card, state: GameState): boolean {
  if (state.pendingDrawCount > 0) {
    // Only draw2 on draw2, or wild4 on wild4 (stacking)
    const top = topCard(state);
    if (top.value === "draw2") return card.value === "draw2";
    if (top.value === "wild4") return card.value === "wild4";
    return false;
  }
  if (card.color === "wild") return true;
  return card.color === state.currentColor || card.value === topCard(state).value;
}

function nextIndex(state: GameState, skip = false): number {
  const n = state.players.length;
  let idx = (state.currentPlayerIndex + state.direction + n) % n;
  if (skip) idx = (idx + state.direction + n) % n;
  return idx;
}

export function playCard(state: GameState, cardId: string, chosenColor?: CardColor): GameState {
  const player = state.players[state.currentPlayerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;
  const card = player.hand[cardIndex];
  if (!canPlay(card, state)) return state;

  const newHand = player.hand.filter((_, i) => i !== cardIndex);
  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  if (newHand.length === 0) {
    return {
      ...state,
      players: newPlayers,
      discardPile: [...state.discardPile, card],
      phase: "won",
      winner: player.name,
      lastAction: `🎉 ${player.name} a gagné !`,
      unoCalledBy: new Set(),
    };
  }

  let direction = state.direction;
  let pendingDraw = state.pendingDrawCount;
  let newColor: CardColor = card.color === "wild" ? (chosenColor ?? "red") : card.color;
  let skip = false;
  let actionMsg = `${player.name} joue ${label(card)}`;
  let phase = state.phase;

  if (card.color === "wild" && !chosenColor) {
    phase = "picking-color";
    return {
      ...state,
      players: newPlayers,
      discardPile: [...state.discardPile, card],
      phase,
      currentColor: newColor,
      lastAction: actionMsg,
      unoCalledBy: new Set(),
    };
  }

  switch (card.value) {
    case "reverse":
      direction = (direction * -1) as 1 | -1;
      if (state.players.length === 2) skip = true;
      actionMsg += " · sens inversé";
      break;
    case "skip":
      skip = true;
      actionMsg += " · joueur suivant passé";
      break;
    case "draw2":
      pendingDraw += 2;
      actionMsg += ` · +2 (total: +${pendingDraw})`;
      break;
    case "wild4":
      pendingDraw += 4;
      actionMsg += ` · +4 (total: +${pendingDraw})`;
      break;
  }

  if (newHand.length === 1) actionMsg += " · UNO !";

  const newState: GameState = {
    ...state,
    players: newPlayers,
    discardPile: [...state.discardPile, card],
    direction,
    currentColor: newColor,
    pendingDrawCount: pendingDraw,
    phase: "playing",
    lastAction: actionMsg,
    unoCalledBy: new Set(),
  };

  newState.currentPlayerIndex = nextIndex({ ...newState, direction }, skip);
  return newState;
}

export function pickColor(state: GameState, color: CardColor): GameState {
  const top = topCard(state);
  let pendingDraw = state.pendingDrawCount;
  let skip = false;
  if (top.value === "wild4") {
    pendingDraw += 4;
    skip = true;
  }
  const newState: GameState = {
    ...state,
    currentColor: color,
    pendingDrawCount: pendingDraw,
    phase: "playing",
    lastAction: `${state.players[state.currentPlayerIndex].name} choisit ${colorName(color)}`,
  };
  newState.currentPlayerIndex = nextIndex(newState, skip);
  return newState;
}

export function drawCards(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const count = state.pendingDrawCount > 0 ? state.pendingDrawCount : 1;

  let deck = [...state.deck];
  let discard = [...state.discardPile];

  if (deck.length < count) {
    const top = discard.pop()!;
    deck = [...deck, ...shuffle(discard)];
    discard = [top];
  }

  const drawn = deck.splice(deck.length - count, count);
  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: [...p.hand, ...drawn] } : p
  );

  const newState: GameState = {
    ...state,
    deck,
    discardPile: discard,
    players: newPlayers,
    pendingDrawCount: 0,
    lastAction: `${player.name} pioche ${count} carte${count > 1 ? "s" : ""}`,
  };
  newState.currentPlayerIndex = nextIndex(newState);
  return newState;
}

export function aiPlay(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  if (!player.isAI || state.phase !== "playing") return state;

  const playable = player.hand.filter((c) => canPlay(c, state));

  if (playable.length === 0) {
    return drawCards(state);
  }

  // Prefer non-wild, then action cards
  const nonWild = playable.filter((c) => c.color !== "wild");
  const chosen = nonWild.length > 0 ? nonWild[0] : playable[0];

  if (chosen.color === "wild") {
    // Pick most common color in hand
    const colorCount: Record<string, number> = { red: 0, green: 0, blue: 0, yellow: 0 };
    for (const c of player.hand) if (c.color !== "wild") colorCount[c.color]++;
    const best = (Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "red") as CardColor;
    return playCard(state, chosen.id, best);
  }

  const afterPlay = playCard(state, chosen.id);
  if (afterPlay.phase === "picking-color") {
    const colorCount: Record<string, number> = { red: 0, green: 0, blue: 0, yellow: 0 };
    for (const c of player.hand) if (c.color !== "wild") colorCount[c.color]++;
    const best = (Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "red") as CardColor;
    return pickColor(afterPlay, best);
  }
  return afterPlay;
}

export function label(card: Card): string {
  const c = colorName(card.color);
  const v = valueName(card.value);
  return card.color === "wild" ? v : `${c} ${v}`;
}

export function colorName(c: CardColor): string {
  return { red: "Rouge", green: "Vert", blue: "Bleu", yellow: "Jaune", wild: "Joker" }[c];
}

export function valueName(v: string): string {
  return (
    { skip: "Passe", reverse: "Inverse", draw2: "+2", wild: "Joker", wild4: "Joker +4" }[v] ?? v
  );
}
