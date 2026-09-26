"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_CLR = ["#1e293b", "#dc2626", "#dc2626", "#1e293b"];
const SUIT_BG = ["#e2e8f0", "#fee2e2", "#fef2f2", "#e2e8f0"];

const FAN = [
  { suit: 0, rank: "K",  rot: -30 },
  { suit: 1, rank: "Q",  rot: -18 },
  { suit: 2, rank: "J",  rot:  -6 },
  { suit: 3, rank: "A",  rot:   6 },
  { suit: 0, rank: "10", rot:  18 },
  { suit: 1, rank: "7",  rot:  30 },
];

interface SavedGame {
  moves: number;
  elapsed: number;
  completedCount: number;
}

export default function SolitaireLobby() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const fanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem("z-solitaire-current");
      if (id) {
        const raw = localStorage.getItem(`z-solitaire-${id}`);
        if (raw) {
          const gs = JSON.parse(raw);
          if (gs && gs.moves > 0 && !gs.won) {
            const completedCount = (gs.foundations as unknown[][]).reduce((n: number, f: unknown[]) => n + f.length, 0);
            setSaved({ moves: gs.moves, elapsed: gs.elapsed ?? 0, completedCount });
            setResumeId(id);
          }
        }
      }
    } catch {}
  }, []);

  function startNew() {
    const id = crypto.randomUUID();
    try { localStorage.setItem("z-solitaire-current", id); } catch {}
    router.push(`/hub/solitaire/${id}`);
  }

  function resume() {
    if (resumeId) router.push(`/hub/solitaire/${resumeId}`);
  }

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 90% 70% at 50% 35%, #0d2e1c 0%, #050e08 55%, #020608 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <a href="/hub" style={{
        position: "absolute", top: 20, left: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 10, textDecoration: "none",
        color: "#475569", fontSize: "0.78rem", fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)",
        transition: "color 0.15s, border-color 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Hub
      </a>

      {/* Fan de cartes */}
      <div
        ref={fanRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: "relative", width: 300, height: 160, marginBottom: -10, flexShrink: 0, cursor: "pointer" }}
      >
        {FAN.map(({ suit, rank, rot }, i) => (
          <motion.div key={i}
            initial={{ y: 60, opacity: 0, rotate: 0 }}
            animate={hovered
              ? { y: 0, opacity: 1, rotate: rot }
              : { y: 0, opacity: 1, rotate: 0 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{
              position: "absolute", left: "50%", bottom: 0,
              marginLeft: -34,
              transformOrigin: "bottom center",
              zIndex: i,
              filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.7))",
            }}
          >
            <div style={{
              width: 68, height: 96, borderRadius: 10,
              background: SUIT_BG[suit],
              border: "1.5px solid rgba(0,0,0,0.1)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              padding: "4px 5px",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: SUIT_CLR[suit], lineHeight: 1.1 }}>
                <div>{rank}</div>
                <div style={{ fontSize: "0.65rem" }}>{SUITS[suit]}</div>
              </div>
              <div style={{ textAlign: "center", fontSize: "1.8rem", color: SUIT_CLR[suit], lineHeight: 1, opacity: 0.85 }}>{SUITS[suit]}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: SUIT_CLR[suit], lineHeight: 1.1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>
                <div>{rank}</div>
                <div style={{ fontSize: "0.65rem" }}>{SUITS[suit]}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: "easeOut" }}
        style={{
          fontSize: "clamp(4rem,11vw,7rem)", fontWeight: 900,
          letterSpacing: "-3px", lineHeight: 1,
          background: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 32px rgba(34,197,94,0.3))",
          margin: "20px 0 6px",
        }}
      >Solitaire</motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ color: "#374151", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 44 }}
      >Klondike · Solo</motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.5, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, padding: "0 20px" }}
      >
        {/* Reprendre */}
        {saved && resumeId && (
          <button onClick={resume} style={{
            padding: "14px 20px", borderRadius: 16,
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
            color: "#4ade80", fontWeight: 900, fontSize: "0.92rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "background 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.06)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)"; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Reprendre
            </span>
            <span style={{ fontSize: "0.7rem", color: "rgba(74,222,128,0.55)", fontWeight: 700, display: "flex", gap: 10 }}>
              <span>{saved.moves} coups</span>
              <span>{fmtTime(saved.elapsed)}</span>
              <span>{saved.completedCount}/52</span>
            </span>
          </button>
        )}

        {/* Nouvelle partie */}
        <button onClick={startNew} style={{
          padding: "15px 0", borderRadius: 16,
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          border: "none", color: "#fff", fontWeight: 900, fontSize: "1rem",
          cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 6px 24px rgba(34,197,94,0.35)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(34,197,94,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(34,197,94,0.35)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle partie
        </button>
      </motion.div>
    </main>
  );
}
