"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ZunoLobby() {
  const [numAI, setNumAI] = useState(1);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  function startGame() {
    const id = crypto.randomUUID();
    sessionStorage.setItem(`zuno_${id}`, JSON.stringify({ numAI }));
    router.push(`/hub/zuno/${id}`);
  }

  async function createMulti() {
    setCreating(true);
    const res = await fetch("/api/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numAI: 0 }),
    });
    if (res.ok) {
      const { code } = await res.json();
      router.push(`/hub/zuno/lobby/${code}`);
    } else { setCreating(false); }
  }

  const fanCards = [
    { color: "card-red",    value: "7",  rot: -28, tx: -130, delay: 0.05 },
    { color: "card-blue",   value: "⊘",  rot: -14, tx: -65,  delay: 0.1  },
    { color: "card-wild",   value: "✦",  rot:   0, tx:   0,  delay: 0.15 },
    { color: "card-green",  value: "+2", rot:  14, tx:  65,  delay: 0.2  },
    { color: "card-yellow", value: "⇄",  rot:  28, tx: 130,  delay: 0.25 },
  ];

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 90% 70% at 50% 35%, #0c2418 0%, #050e0a 55%, #020608 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <a href="/hub" style={{
        position: "absolute", top: 20, left: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 10, textDecoration: "none",
        color: "#475569", fontSize: "0.78rem", fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        transition: "color 0.15s, border-color 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Hub
      </a>
      <div style={{ position: "relative", width: 340, height: 160, marginBottom: -20, flexShrink: 0 }}>
        {fanCards.map(({ color, value, rot, tx, delay }, i) => (
          <motion.div key={i}
            initial={{ y: 60, opacity: 0, rotate: rot }}
            animate={{ y: 0, opacity: 1, rotate: rot }}
            transition={{ delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: "absolute", left: "50%", bottom: 0, marginLeft: -36,
              transformOrigin: "bottom center",
              transform: `translateX(${tx}px) rotate(${rot}deg)`,
              zIndex: i, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
            }}
          >
            <div className={`card fan-card ${color}`} style={{ width: 72, height: 104, borderRadius: 12 }}>
              <div className="card-face">
                <div className="card-oval" />
                <span className="card-symbol" style={{ fontSize: "1.8rem" }}>{value}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        style={{
          fontSize: "clamp(5.5rem,14vw,9rem)", fontWeight: 900,
          letterSpacing: "-4px", lineHeight: 1, paddingRight: 8,
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #ef4444 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 40px rgba(245,158,11,0.35))",
          margin: "24px 0 8px",
        }}
      >ZUNO</motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        style={{ color: "#4b5563", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 48 }}
      >Le jeu de cartes</motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", maxWidth: 580 }}
      >
        {/* Solo */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.18)",
          borderRadius: 22, padding: "22px 24px 20px", backdropFilter: "blur(12px)",
          flex: "1 1 230px", gap: 0,
        }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#78350f", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>Solo · IA</div>
          <div style={{ fontSize: "0.63rem", color: "#374151", marginBottom: 14 }}>Joue contre des bots</div>

          <div style={{ fontSize: "0.6rem", color: "#374151", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Adversaires</div>
          <div style={{ display: "flex", gap: 5, marginBottom: 18 }}>
            {[1,2,3,4,5,6,7].map((n) => (
              <button key={n} onClick={() => setNumAI(n)} style={{
                width: 32, height: 32, borderRadius: 8, fontWeight: 900, fontSize: "0.82rem",
                border: numAI === n ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.08)",
                background: numAI === n ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)",
                color: numAI === n ? "#f59e0b" : "#475569", cursor: "pointer",
                transform: numAI === n ? "scale(1.12)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
              }}>{n}</button>
            ))}
          </div>

          <button onClick={startGame} style={{
            padding: "11px 0", borderRadius: 12, width: "100%", marginTop: "auto",
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            border: "none", color: "#fff", fontWeight: 900, fontSize: "0.92rem",
            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 6px 20px rgba(239,68,68,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(239,68,68,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.35)"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Jouer
          </button>
        </div>

        {/* Multijoueur */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.22)",
          borderRadius: 22, padding: "22px 24px 20px", backdropFilter: "blur(12px)",
          flex: "1 1 230px", gap: 0,
        }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#3730a3", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>Multijoueur</div>
          <div style={{ fontSize: "0.63rem", color: "#374151", marginBottom: 14, textAlign: "center" }}>Joue avec tes amis en ligne</div>

          <div style={{ fontSize: "0.6rem", color: "#374151", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Joueurs</div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            {[["#6366f1","B"],["#8b5cf6","A"],["#a78bfa","S"],["#c4b5fd","?"]].map(([bg, l], i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "#fff", marginLeft: i > 0 ? -10 : 0, border: "2px solid #030b07" }}>{l}</div>
            ))}
            <span style={{ fontSize: "0.65rem", color: "#374151", marginLeft: 10, fontWeight: 600 }}>2 à 8 joueurs</span>
          </div>

          <button onClick={createMulti} disabled={creating} style={{
            padding: "11px 0", borderRadius: 12, width: "100%", marginTop: "auto",
            background: creating ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", color: creating ? "#6366f1" : "#fff", fontWeight: 900, fontSize: "0.92rem",
            cursor: creating ? "default" : "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: creating ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => { if (!creating) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(99,102,241,0.6)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = creating ? "none" : "0 6px 20px rgba(99,102,241,0.4)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {creating ? "Création…" : "Créer une salle"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
