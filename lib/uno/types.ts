export type CardColor = "red" | "green" | "blue" | "yellow" | "wild";
export type CardValue =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAI: boolean;
}

export type Direction = 1 | -1;
export type GamePhase = "idle" | "playing" | "picking-color" | "won";

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  currentColor: CardColor;
  phase: GamePhase;
  winner: string | null;
  pendingDrawCount: number;
  lastAction: string;
  unoCalledBy: Set<string>;
}
