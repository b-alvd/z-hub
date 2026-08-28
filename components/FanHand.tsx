"use client";
import { Card } from "@/lib/uno/types";
import UnoCard from "./UnoCard";

interface Props {
  cards: Card[];
  faceDown?: boolean;
  playable?: Set<string>;
  onPlay?: (cardId: string) => void;
  className?: string;
}

export default function FanHand({ cards, faceDown = false, playable, onPlay, className = "" }: Props) {
  const n = cards.length;
  if (n === 0) return null;

  const maxAngle = Math.min(60, n * 7);
  const step = n > 1 ? (maxAngle * 2) / (n - 1) : 0;

  return (
    <div
      className={`relative flex items-end justify-center ${className}`}
      style={{ height: faceDown ? 70 : 130, minWidth: 120 }}
    >
      {cards.map((card, i) => {
        const angle = n > 1 ? -maxAngle + step * i : 0;
        const isPlayable = playable?.has(card.id) ?? false;
        const isDisabled = playable !== undefined && !isPlayable;

        return (
          <UnoCard
            key={card.id}
            card={card}
            faceDown={faceDown}
            size={faceDown ? "mini" : "fan"}
            playable={isPlayable}
            disabled={isDisabled}
            onClick={isPlayable && onPlay ? () => onPlay(card.id) : undefined}
            style={{
              position: "absolute",
              transformOrigin: "bottom center",
              transform: `rotate(${angle}deg)`,
              bottom: 0,
              left: "50%",
              marginLeft: faceDown ? "-16px" : "-29px",
              zIndex: i,
              transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1)",
            }}
          />
        );
      })}
    </div>
  );
}
