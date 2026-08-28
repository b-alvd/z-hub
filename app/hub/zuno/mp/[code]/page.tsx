"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import UnoCard from "@/components/UnoCard";
import ColorPicker from "@/components/ColorPicker";
import { CardColor, CardValue } from "@/lib/uno/types";

type SanitizedPlayer = { id: string; name: string; isAI: boolean; handCount: number; hand: { id: string; color: CardColor; value: CardValue }[] };
type SanitizedCard = { id: string; color: CardColor; value: CardValue };
type GameState = {
  deck: number;
  discardPile: SanitizedCard[];
  players: SanitizedPlayer[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: CardColor;
  phase: string;
  winner: string | null;
  pendingDrawCount: number;
  lastAction: string;
};

const COLOR_NAME: Record<CardColor, string> = { red: "Rouge", green: "Vert", blue: "Bleu", yellow: "Jaune", wild: "?" };
const AVATAR_BG = ["#8b5cf6","#ec4899","#f97316","#06b6d4","#84cc16","#f43f5e","#a855f7","#14b8a6","#fb923c"];

function topCard(state: GameState) { return state.discardPile[state.discardPile.length - 1]; }

export default function ZunoMP() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState(-1);
  const [pickingColor, setPickingColor] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [acting, setActing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) { setError("Partie introuvable"); return; }
    const data = await res.json();
    if (data.status === "waiting") { router.replace(`/hub/zuno/lobby/${code}`); return; }
    if (data.gameState) setGameState(data.gameState);
    setMyPlayerIndex(data.myPlayerIndex);
  }, [code, router]);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchState]);

  async function sendAction(body: object) {
    if (acting) return;
    setActing(true);
    const res = await fetch(`/api/rooms/${code}/action`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.gameState) setGameState(data.gameState);
    else if (!res.ok) setError(data.error || "Erreur");
    setActing(false);
  }

  function handlePlay(cardId: string) {
    const card = gameState?.players[myPlayerIndex]?.hand.find((c) => c.id === cardId);
    if (!card) return;
    if (card.color === "wild") { setPendingCardId(cardId); setPickingColor(true); return; }
    sendAction({ type: "play", cardId });
  }

  function handleColorPick(color: CardColor) {
    setPickingColor(false);
    if (pendingCardId) sendAction({ type: "play", cardId: pendingCardId, color });
    setPendingCardId(null);
  }

  if (error) return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030b07" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>{error}</p>
        <a href="/hub" style={{ color: "#94a3b8", fontSize: "0.85rem" }}>← Retour au hub</a>
      </div>
    </main>
  );

  if (!gameState || myPlayerIndex < 0) return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030b07" }}>
      <div style={{ color: "#374151", fontSize: "0.9rem" }}>Chargement…</div>
    </main>
  );

  if (gameState.phase === "won") {
    const isMe = gameState.winner === gameState.players[myPlayerIndex]?.name;
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "#030b07" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: isMe ? "rgba(245,158,11,0.1)" : "rgba(148,163,184,0.08)", border: `1px solid ${isMe ? "rgba(245,158,11,0.3)" : "rgba(148,163,184,0.15)"}` }}>
          {isMe
            ? <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
        </div>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 900, color: isMe ? "#f59e0b" : "#94a3b8" }}>{isMe ? "Tu as gagné !" : `${gameState.winner} a gagné !`}</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <a href="/hub/zuno" style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontWeight: 800, textDecoration: "none", fontSize: "0.9rem" }}>Rejouer</a>
          <a href="/hub" style={{ padding: "12px 28px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.08)" }}>Hub</a>
        </div>
      </main>
    );
  }

  const me = gameState.players[myPlayerIndex];
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex && gameState.phase === "playing";
  const top = topCard(gameState);
  const canPlayCard = (card: SanitizedCard) => {
    if (gameState.pendingDrawCount > 0) {
      return (card.value === "draw2" && top.value === "draw2") || (card.value === "wild4" && top.value === "wild4");
    }
    return card.color === "wild" || card.color === gameState.currentColor || card.value === top.value;
  };
  const myPlayable = me?.hand.filter(canPlayCard) ?? [];
  const mustDraw = isMyTurn && myPlayable.length === 0;
  const canCounter = isMyTurn && gameState.pendingDrawCount > 0 && myPlayable.length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 90% 70% at 50% 30%, #0a1f12 0%, #030b07 60%, #020608 100%)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit" }}>
      {pickingColor && !confirmQuit && <ColorPicker onPick={handleColorPick} />}

      {/* Quit modal */}
      {confirmQuit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 36px", textAlign: "center", maxWidth: 300 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p style={{ fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>Tu veux vraiment quitter ?</p>
            <p style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 24 }}>La partie continuera sans toi.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmQuit(false)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <a href="/hub" style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 800, color: "#fff", background: "#ef4444", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Quitter</a>
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-1px", background: "linear-gradient(120deg,#fbbf24,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Z-HUB</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#374151", fontWeight: 700, letterSpacing: "0.1em" }}>{code}</span>
          <button onClick={() => setConfirmQuit(true)} style={{ color: "#ef4444", fontSize: "0.75rem", padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Quitter
          </button>
        </div>
      </div>

      {/* Other players */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "12px 16px", flexWrap: "wrap", flexShrink: 0 }}>
        {gameState.players.map((p, i) => {
          if (i === myPlayerIndex) return null;
          const isCurrent = gameState.currentPlayerIndex === i;
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 14,
              background: isCurrent ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${isCurrent ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.07)"}`,
              transition: "all 0.3s",
            }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: AVATAR_BG[i % AVATAR_BG.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "#fff" }}>{p.name[0]}</div>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isCurrent ? "#f59e0b" : "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                {p.name}
                {p.isAI && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></svg>}
              </div>
                <div style={{ fontSize: "0.55rem", color: isCurrent ? "#d97706" : "#475569" }}>{p.handCount} carte{p.handCount !== 1 ? "s" : ""}</div>
              </div>
              {/* Mini fan */}
              <div style={{ display: "flex", marginLeft: 4 }}>
                {Array.from({ length: Math.min(p.handCount, 5) }).map((_, j) => (
                  <div key={j} style={{ width: 12, height: 18, borderRadius: 3, background: "linear-gradient(145deg,#243044,#161f30)", border: "1px solid rgba(255,255,255,0.09)", marginLeft: j === 0 ? 0 : -5 }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center: deck + discard */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
        {/* Deck */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div className={`card pile-card card-back ${mustDraw || (isMyTurn && gameState.pendingDrawCount === 0) ? "draw-pile" : "draw-pile-off"}`}
            style={{ cursor: (mustDraw || (isMyTurn && gameState.pendingDrawCount === 0)) && !acting ? "pointer" : "default" }}
            onClick={() => { if ((mustDraw || (isMyTurn && gameState.pendingDrawCount === 0)) && !acting) sendAction({ type: "draw" }); }}>
            <div className="card-face"><div className="card-oval" /><span className="card-back-label">ZUNO</span></div>
          </div>
          <span style={{ fontSize: "0.6rem", color: "#374151" }}>{gameState.deck}</span>
        </div>

        {/* Direction + pending */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div className="dir-ring" style={{ transform: `rotate(${gameState.direction === 1 ? 0 : 180}deg)` }}>↻</div>
          {gameState.pendingDrawCount > 0 && <span className="pending-badge">+{gameState.pendingDrawCount}</span>}
        </div>

        {/* Discard */}
        <div>
          <UnoCard key={top.id} card={top} size="pile" />
        </div>
      </div>

      {/* Last action */}
      <div style={{ textAlign: "center", padding: "0 16px 6px", flexShrink: 0 }}>
        <span style={{ fontSize: "0.7rem", color: "#1e293b", fontStyle: "italic" }}>{gameState.lastAction}</span>
      </div>

      {/* My hand */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={`avatar${isMyTurn ? " active" : ""}`} style={{ background: "#10b981", width: 28, height: 28, fontSize: "0.72rem" }}>V</div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isMyTurn ? "#f1f5f9" : "#94a3b8" }}>
              Vous <span style={{ fontWeight: 500, color: "#64748b" }}>· {me?.hand.length ?? 0} carte{(me?.hand.length ?? 0) !== 1 ? "s" : ""}</span>
            </span>
            {canCounter && (
              <button className="draw-btn" style={{ marginLeft: 6 }} onClick={() => sendAction({ type: "draw" })}>
                Piocher {gameState.pendingDrawCount}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR_NAME[gameState.currentColor] !== "?" ? gameState.currentColor === "red" ? "#ef4444" : gameState.currentColor === "green" ? "#22c55e" : gameState.currentColor === "blue" ? "#3b82f6" : "#eab308" : "#c084fc" }} />
            <span style={{ fontSize: "0.68rem", color: "#374151", fontWeight: 600 }}>{COLOR_NAME[gameState.currentColor]}</span>
          </div>
        </div>

        {/* Cards */}
        <div className="hand-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 14px", justifyContent: me && me.hand.length <= 7 ? "center" : "flex-start" }}>
          {me?.hand.map((card) => {
            const playable = isMyTurn && canPlayCard(card) && !acting;
            return (
              <div key={card.id} data-card-id={card.id} style={{
                flexShrink: 0, cursor: playable ? "pointer" : "default", transform: playable ? "translateY(-8px)" : "none",
                transition: "transform 0.15s", filter: !isMyTurn || canPlayCard(card) ? "none" : "brightness(0.45) saturate(0.4)",
              }} onClick={() => playable && handlePlay(card.id)}>
                <UnoCard card={card} size="hand" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
