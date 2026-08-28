"use client";
import { CSSProperties } from "react";
import { Card } from "@/lib/uno/types";
import { valueName } from "@/lib/uno/game";

interface Props {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  playable?: boolean;
  size?: "pile" | "hand" | "fan" | "mini";
  faceDown?: boolean;
  style?: CSSProperties;
  className?: string;
}

const SYMBOLS: Record<string, string> = {
  skip: "⊘", reverse: "⇄", draw2: "+2", wild: "✦", wild4: "+4",
};

export default function UnoCard({
  card, onClick, disabled, playable,
  size = "hand", faceDown, style, className = "",
}: Props) {
  const sizeClass = `${size}-card`;
  const colorClass = faceDown ? "card-back" : `card-${card.color}`;
  const stateClass = disabled ? "card-disabled" : playable ? "card-playable" : "";
  const sym = SYMBOLS[card.value] ?? card.value;
  const corner = valueName(card.value);

  return (
    <div
      className={`card ${sizeClass} ${colorClass} ${stateClass} ${className}`}
      style={style}
      onClick={!disabled && onClick ? onClick : undefined}
      role={onClick && !disabled ? "button" : undefined}
      aria-label={faceDown ? "Carte cachée" : `${card.color} ${card.value}`}
    >
      {faceDown ? (
        <div className="card-face">
          <div className="card-oval" />
          <span className="card-back-label">ZUNO</span>
        </div>
      ) : (
        <div className="card-face">
          <div className="card-oval" />
          <span className="card-corner tl">{corner}</span>
          <span className="card-symbol">{sym}</span>
          <span className="card-corner br">{corner}</span>
        </div>
      )}
    </div>
  );
}
