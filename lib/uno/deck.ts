import { Card, CardColor, CardValue } from "./types";

const COLORS: CardColor[] = ["red", "green", "blue", "yellow"];
const NUMBERED: CardValue[] = ["0","1","2","3","4","5","6","7","8","9"];
const ACTIONS: CardValue[] = ["skip", "reverse", "draw2"];

let idCounter = 0;
function makeCard(color: CardColor, value: CardValue): Card {
  return { id: `${color}-${value}-${idCounter++}`, color, value };
}

export function createDeck(): Card[] {
  idCounter = 0;
  const cards: Card[] = [];

  for (const color of COLORS) {
    cards.push(makeCard(color, "0"));
    for (const val of [...NUMBERED.slice(1), ...ACTIONS]) {
      cards.push(makeCard(color, val));
      cards.push(makeCard(color, val));
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push(makeCard("wild", "wild"));
    cards.push(makeCard("wild", "wild4"));
  }

  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
