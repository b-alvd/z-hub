"use client";
import { CardColor } from "@/lib/uno/types";

const COLORS: { color: CardColor; label: string; bg: string }[] = [
  { color: "red",    label: "Rouge",  bg: "linear-gradient(145deg,#ff5252,#b71c1c)" },
  { color: "green",  label: "Vert",   bg: "linear-gradient(145deg,#66bb6a,#1b5e20)" },
  { color: "blue",   label: "Bleu",   bg: "linear-gradient(145deg,#42a5f5,#0d47a1)" },
  { color: "yellow", label: "Jaune",  bg: "linear-gradient(145deg,#fff176,#f57f17)" },
];

export default function ColorPicker({ onPick }: { onPick: (c: CardColor) => void }) {
  return (
    <div className="picker-overlay">
      <div className="picker-box">
        <p className="text-white font-black text-lg tracking-wide">Choisissez une couleur</p>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ color, label, bg }) => (
            <button key={color} onClick={() => onPick(color)} className="color-btn" style={{ background: bg }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
