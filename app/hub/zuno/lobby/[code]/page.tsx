"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type RoomPlayer = { userId: string; username: string; playerIndex: number };
type RoomData = { code: string; status: string; numAI: number; players: RoomPlayer[]; isHost: boolean; myPlayerIndex: number };

const AVATAR_COLORS = ["#6366f1","#ec4899","#f97316","#06b6d4","#84cc16","#f43f5e","#a855f7","#14b8a6"];

const EMPTY_SLOTS = 8;

export default function ZunoLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (res.status === 404) { router.replace("/hub/zuno"); return; }
    if (!res.ok) { setError("Erreur de connexion"); return; }
    const data = await res.json();
    setRoom(data);
    if (data.status === "playing") router.replace(`/hub/zuno/mp/${code}`);
  }, [code, router]);

  useEffect(() => {
    fetchRoom();
    const t = setInterval(fetchRoom, 2000);
    return () => clearInterval(t);
  }, [fetchRoom]);

  async function closeLobby() {
    setClosing(true);
    await fetch(`/api/rooms/${code}/close`, { method: "POST" });
    router.replace("/hub/zuno");
  }

  async function startGame() {
    setStarting(true);
    const res = await fetch(`/api/rooms/${code}/start`, { method: "POST" });
    if (!res.ok) { const d = await res.json(); setError(d.error); setStarting(false); return; }
    router.replace(`/hub/zuno/mp/${code}`);
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a0808 0%, #050e0a 50%, #020608 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.5px" }}>Partie introuvable</div>
        <div style={{ fontSize: "0.82rem", color: "#374151", maxWidth: 260, lineHeight: 1.6 }}>
          Ce code ne correspond à aucune salle active.<br />Vérifie l'orthographe ou demande un nouveau code.
        </div>
        <a href="/hub" style={{
          marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 22px", borderRadius: 12, textDecoration: "none",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700,
          transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Retour au hub
        </a>
      </div>
    </main>
  );

  if (!room) return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030b07" }}>
      <div style={{ color: "#1f2937", fontSize: "0.9rem" }}>Chargement…</div>
    </main>
  );

  const filledCount = room.players.length;
  const emptyCount = EMPTY_SLOTS - filledCount;
  const myUserId = room.players[room.myPlayerIndex]?.userId;
  const canStart = room.isHost && filledCount >= 2 && !starting;

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 80% 60% at 50% 30%, #0d1f3c 0%, #050e0a 50%, #020608 100%)",
      padding: "40px 20px", position: "relative",
    }}>
      {/* Back */}
      <a href="/hub/zuno" style={{
        position: "absolute", top: 20, left: 20,
        color: "#374151", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none",
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 9,
        border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = "#64748b"}
        onMouseLeave={e => e.currentTarget.style.color = "#374151"}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour
      </a>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: "clamp(2.8rem,7vw,4.5rem)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, background: "linear-gradient(135deg,#fbbf24,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 30px rgba(245,158,11,0.3))" }}>ZUNO</div>
        <div style={{ color: "#1f2937", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", marginTop: 6 }}>Salle d'attente</div>
      </div>

      {/* Code */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: "0.6rem", color: "#1f2937", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 10 }}>Code de la partie</div>
        <button onClick={copyCode} style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "16px 32px", borderRadius: 18, cursor: "pointer",
          background: copied ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.07)",
          border: `2px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.35)"}`,
          fontFamily: "monospace", fontSize: "2.2rem", fontWeight: 900, letterSpacing: "0.25em",
          color: copied ? "#22c55e" : "#818cf8",
          transition: "all 0.2s",
        }}>
          {code}
          {copied
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.45 }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          }
        </button>
        <div style={{ color: "#1f2937", fontSize: "0.68rem", marginTop: 8 }}>
          {copied ? "✓ Copié dans le presse-papier" : "Clique pour copier · Partage aux autres joueurs"}
        </div>
      </div>

      {/* Players grid */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 22, padding: "20px 24px", marginBottom: 24,
        width: "100%", maxWidth: 420,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: "0.62rem", color: "#1f2937", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Joueurs</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: filledCount >= 2 ? "#22c55e" : "#374151" }}>
            {filledCount} / {EMPTY_SLOTS}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {/* Real players */}
          {room.players.map((p, i) => {
            const isMe = p.userId === myUserId;
            const isHost = p.playerIndex === 0;
            return (
              <div key={p.userId} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: isMe ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isMe ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 900, color: "#fff",
                  boxShadow: `0 0 12px ${AVATAR_COLORS[i % AVATAR_COLORS.length]}55`,
                }}>{p.username[0].toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: isMe ? "#a5b4fc" : "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.username}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    {isHost && <span style={{ fontSize: "0.52rem", color: "#f59e0b", fontWeight: 800, background: "rgba(245,158,11,0.1)", padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)", lineHeight: 1.6 }}>HÔTE</span>}
                    {isMe && <span style={{ fontSize: "0.52rem", color: "#6366f1", fontWeight: 800, lineHeight: 1.6 }}>Vous</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12,
              background: "rgba(255,255,255,0.01)",
              border: "1px dashed rgba(255,255,255,0.05)",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "#1f2937", fontStyle: "italic" }}>En attente…</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      {room.isHost ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button onClick={closeLobby} disabled={closing} style={{
            padding: "15px 18px", borderRadius: 14, flexShrink: 0,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", fontFamily: "inherit",
            cursor: closing ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => { if (!closing) { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {closing ? "…" : "Fermer"}
          </button>
          <button onClick={startGame} disabled={!canStart} style={{ flex: 1,
            width: "100%", padding: "15px", borderRadius: 14,
            background: canStart ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(255,255,255,0.05)",
            border: canStart ? "none" : "1px solid rgba(255,255,255,0.07)",
            color: canStart ? "#fff" : "#374151",
            fontWeight: 900, fontSize: "1rem", fontFamily: "inherit",
            cursor: canStart ? "pointer" : "default",
            boxShadow: canStart ? "0 8px 28px rgba(239,68,68,0.4)" : "none",
            transition: "transform 0.15s, box-shadow 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
            onMouseEnter={e => { if (canStart) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(239,68,68,0.55)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = canStart ? "0 8px 28px rgba(239,68,68,0.4)" : "none"; }}
          >
            {starting ? "Lancement…" : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Lancer la partie
              </>
            )}
          </button>
          </div>
          {filledCount < 2 && <p style={{ fontSize: "0.7rem", color: "#374151", margin: 0 }}>Il faut au moins 2 joueurs pour commencer</p>}
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 22px", borderRadius: 14,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "#374151",
                animation: `pulse ${0.9 + i * 0.15}s ease-in-out ${i * 0.15}s infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>En attente que l'hôte lance…</span>
        </div>
      )}
    </main>
  );
}
