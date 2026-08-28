"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import UnoCard from "@/components/UnoCard";
import ColorPicker from "@/components/ColorPicker";
import { CardColor, CardValue } from "@/lib/uno/types";

type SanitizedCard = { id: string; color: CardColor; value: CardValue };
type SanitizedPlayer = { id: string; name: string; isAI: boolean; handCount: number; hand: SanitizedCard[] };
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

const AVATAR_BG = ["#8b5cf6","#ec4899","#f97316","#06b6d4","#84cc16","#f43f5e","#a855f7","#14b8a6","#fb923c"];
const COLOR_DOT: Record<CardColor, string> = { red:"#ff5252", green:"#66bb6a", blue:"#42a5f5", yellow:"#fff176", wild:"#c084fc" };
const COLOR_NAME: Record<CardColor, string> = { red:"Rouge", green:"Vert", blue:"Bleu", yellow:"Jaune", wild:"?" };

function topCard(s: GameState) { return s.discardPile[s.discardPile.length - 1]; }

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
  const [logKey, setLogKey] = useState(0);
  const [vscale, setVscale] = useState(1);
  const [newCardAnim, setNewCardAnim] = useState(0); // increments to retrigger discard anim
  const [timeLeft, setTimeLeft] = useState(30);
  const prevStateRef = useRef<GameState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setVscale(Math.min(window.innerWidth / 1366, window.innerHeight / 768, 1));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Timer: 30s per turn, auto-draw at 0
  useEffect(() => {
    if (!gameState) return;
    const myTurn = gameState.currentPlayerIndex === myPlayerIndex && gameState.phase === "playing";
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!myTurn) return;
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerIndex, gameState?.phase, myPlayerIndex]);

  // Auto-draw when timer hits 0
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (gameState?.currentPlayerIndex === myPlayerIndex && gameState?.phase === "playing" && !acting) {
      sendAction({ type: "draw" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handScrollCallbackRef = useCallback((el: HTMLDivElement | null) => {
    const prev = handScrollRef.current;
    if (prev) prev.removeEventListener("wheel", (prev as any)._wheelHandler);
    handScrollRef.current = el;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); el.scrollLeft += e.deltaY + e.deltaX; };
    (el as any)._wheelHandler = handler;
    el.addEventListener("wheel", handler, { passive: false });
  }, []);

  const applyNewState = useCallback((newState: GameState, newIdx: number) => {
    const prev = prevStateRef.current;
    if (prev) {
      const prevTop = prev.discardPile[prev.discardPile.length - 1];
      const nextTop = newState.discardPile[newState.discardPile.length - 1];
      if (prevTop?.id !== nextTop?.id) setNewCardAnim(n => n + 1);
      if (prev.lastAction !== newState.lastAction) setLogKey(k => k + 1);
    } else {
      setLogKey(k => k + 1);
    }
    prevStateRef.current = newState;
    setGameState(newState);
    setMyPlayerIndex(newIdx);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) { if (res.status === 404) { setError("Partie introuvable"); } return; }
      const data = await res.json();
      if (data.status === "waiting") { router.replace(`/hub/zuno/lobby/${code}`); return; }
      if (data.gameState) applyNewState(data.gameState, data.myPlayerIndex);
    } catch { /* ignore network errors */ }
  }, [code, router, applyNewState]);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchState]);

  async function sendAction(body: object) {
    if (acting) return;
    setActing(true);
    try {
      const res = await fetch(`/api/rooms/${code}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.gameState) applyNewState(data.gameState, myPlayerIndex);
      else if (!res.ok) setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); }
    setActing(false);
  }

  function handlePlay(cardId: string) {
    const card = gameState?.players[myPlayerIndex]?.hand.find(c => c.id === cardId);
    if (!card) return;
    if (card.color === "wild") { setPendingCardId(cardId); setPickingColor(true); return; }
    sendAction({ type: "play", cardId });
  }

  function handleColorPick(color: CardColor) {
    setPickingColor(false);
    const id = pendingCardId;
    setPendingCardId(null);
    if (id) sendAction({ type: "play", cardId: id, color });
  }

  if (error) return (
    <main style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#030b07" }}>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:"#ef4444", fontWeight:700, marginBottom:16 }}>{error}</p>
        <a href="/hub" style={{ color:"#94a3b8", fontSize:"0.85rem" }}>← Retour au hub</a>
      </div>
    </main>
  );

  if (!gameState || myPlayerIndex < 0) return (
    <main style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#030b07" }}>
      <div style={{ color:"#374151", fontSize:"0.9rem" }}>Chargement…</div>
    </main>
  );

  if (gameState.phase === "won") {
    const me = gameState.players[myPlayerIndex];
    const isMe = gameState.winner === me?.name;
    return (
      <main style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, background:"#030b07" }}>
        <div style={{ width:72, height:72, borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", background: isMe?"rgba(245,158,11,0.1)":"rgba(148,163,184,0.08)", border:`1px solid ${isMe?"rgba(245,158,11,0.3)":"rgba(148,163,184,0.15)"}` }}>
          {isMe
            ? <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
        </div>
        <h2 style={{ fontSize:"2.5rem", fontWeight:900, color: isMe?"#f59e0b":"#94a3b8" }}>{isMe ? "Vous avez gagné !" : `${gameState.winner} a gagné !`}</h2>
        <div style={{ display:"flex", gap:12, marginTop:8 }}>
          <a href="/hub/zuno" style={{ padding:"12px 28px", borderRadius:12, background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"#fff", fontWeight:800, textDecoration:"none", fontSize:"0.9rem" }}>Rejouer</a>
          <a href="/hub" style={{ padding:"12px 28px", borderRadius:12, background:"rgba(255,255,255,0.06)", color:"#94a3b8", fontWeight:700, textDecoration:"none", fontSize:"0.9rem", border:"1px solid rgba(255,255,255,0.08)" }}>Hub</a>
        </div>
      </main>
    );
  }

  const me = gameState.players[myPlayerIndex];
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex && gameState.phase === "playing";
  const top = topCard(gameState);

  function canPlayCard(card: SanitizedCard) {
    if (gameState!.pendingDrawCount > 0) {
      const t = top;
      if (t.value === "draw2") return card.value === "draw2";
      if (t.value === "wild4") return card.value === "wild4";
      return false;
    }
    return card.color === "wild" || card.color === gameState!.currentColor || card.value === top.value;
  }

  const playableIds = new Set(isMyTurn ? (me?.hand ?? []).filter(canPlayCard).map(c => c.id) : []);
  const mustDraw = isMyTurn && playableIds.size === 0;
  const canCounter = isMyTurn && gameState.pendingDrawCount > 0 && playableIds.size > 0;

  // Arc positioning for other players
  const others = gameState.players.map((p, i) => ({ ...p, origIdx: i })).filter(p => p.origIdx !== myPlayerIndex);
  const numOthers = others.length;
  const badgeW = Math.round((numOthers <= 4 ? 200 : numOthers <= 6 ? 170 : 145) * vscale);
  const badgeH = Math.round(120 * vscale);
  const arcRadius = Math.round(310 * vscale);
  const totalArc = Math.min(numOthers * 40, 280);
  const arcStart = -90 - totalArc / 2, arcEnd = -90 + totalArc / 2;

  const otherPositions = others.map((_, i) => {
    const deg = numOthers === 1 ? -90 : arcStart + (arcEnd - arcStart) * i / (numOthers - 1);
    const rad = (deg * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * arcRadius), y = Math.round(Math.sin(rad) * arcRadius);
    return { left:`calc(50% + ${x}px - ${badgeW / 2}px)`, top:`calc(46% + ${y}px - ${badgeH / 2}px)` };
  });

  return (
    <div style={{ position:"fixed", inset:0 }}>
      {pickingColor && !confirmQuit && <ColorPicker onPick={handleColorPick} />}

      {/* Modal quitter */}
      {confirmQuit && (
        <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#0d1f14", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"32px 36px", textAlign:"center", maxWidth:320 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p style={{ fontSize:"1rem", fontWeight:800, color:"#e2e8f0", marginBottom:8 }}>Tu veux vraiment quitter ?</p>
            <p style={{ fontSize:"0.8rem", color:"#475569", marginBottom:24 }}>La partie continuera sans toi.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setConfirmQuit(false)} style={{ padding:"9px 20px", borderRadius:10, fontSize:"0.82rem", fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
              <a href="/hub" style={{ padding:"9px 20px", borderRadius:10, fontSize:"0.82rem", fontWeight:800, color:"#fff", background:"#ef4444", textDecoration:"none", display:"inline-flex", alignItems:"center" }}>Quitter</a>
            </div>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:48, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:50 }}>
        <span style={{ fontWeight:900, fontSize:"1.1rem", letterSpacing:"-1px", background:"linear-gradient(120deg,#fbbf24,#ef4444)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Z-HUB</span>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"monospace", fontSize:"0.72rem", color:"#374151", fontWeight:700, letterSpacing:"0.1em" }}>{code}</span>
          <button onClick={() => setConfirmQuit(true)} style={{ color:"#ef4444", fontSize:"0.75rem", padding:"5px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.06)", display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"inherit", transition:"border-color 0.15s, background 0.15s" }}
            onMouseEnter={e => { const el=e.currentTarget; el.style.background="rgba(239,68,68,0.14)"; el.style.borderColor="rgba(239,68,68,0.4)"; }}
            onMouseLeave={e => { const el=e.currentTarget; el.style.background="rgba(239,68,68,0.06)"; el.style.borderColor="rgba(239,68,68,0.2)"; }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Quitter
          </button>
        </div>
      </div>

      {/* BADGES AUTRES JOUEURS */}
      {others.map((player, i) => {
        const isCurrent = gameState.currentPlayerIndex === player.origIdx;
        const count = player.handCount;
        const fanCount = Math.min(count, 9), fanSpacing = 14, cardW = 32, cardH = 46;
        return (
          <div key={player.id} style={{
            position:"absolute", ...otherPositions[i], zIndex:20,
            display:"flex", flexDirection:"column", alignItems:"center", gap:7,
            padding:"8px 10px 10px", width:badgeW,
            background: isCurrent?"rgba(245,158,11,0.07)":"rgba(6,12,24,0.88)",
            border:`1.5px solid ${isCurrent?"rgba(245,158,11,0.5)":"rgba(255,255,255,0.07)"}`,
            borderRadius:20, backdropFilter:"blur(16px)",
            boxShadow: isCurrent?"0 0 28px rgba(245,158,11,0.22),0 8px 24px rgba(0,0,0,0.65)":"0 4px 20px rgba(0,0,0,0.6)",
            transition:"border-color 0.3s, background 0.3s, box-shadow 0.3s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div className={`avatar${isCurrent?" active":""}`} style={{ background:AVATAR_BG[player.origIdx % AVATAR_BG.length], width:30, height:30, fontSize:"0.72rem", flexShrink:0 }}>{player.name[0]}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:"0.68rem", fontWeight:700, color:isCurrent?"#f59e0b":"#cbd5e1", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:badgeW-60 }}>{player.name}</div>
                <div style={{ fontSize:"0.55rem", color:isCurrent?"#d97706":"#475569" }}>{count} carte{count!==1?"s":""}</div>
              </div>
              {isCurrent && <div className="thinking-dots" style={{ transform:"scale(0.65)", flexShrink:0 }}><div className="thinking-dot"/><div className="thinking-dot"/><div className="thinking-dot"/></div>}
            </div>
            <div style={{ position:"relative", width:badgeW-20, height:cardH+6 }}>
              {Array.from({ length: fanCount }).map((_, j) => {
                const center=(fanCount-1)/2, offset=(j-center)*fanSpacing, rot=(j-center)*3, yUp=Math.abs(j-center)*0.6;
                return <div key={j} style={{ position:"absolute", left:`calc(50% + ${offset}px - ${cardW/2}px)`, top:yUp, transform:`rotate(${rot}deg)`, transformOrigin:"bottom center", filter:isCurrent?"brightness(1.15)":"brightness(0.7)", transition:"filter 0.3s" }}><UnoCard card={{ id:`back-${j}`, color:"wild", value:"wild" }} size="mini" faceDown={true} /></div>;
              })}
            </div>
          </div>
        );
      })}

      {/* TABLE CENTRALE */}
      <div style={{
        position:"absolute", top:"46%", left:"50%", transform:"translate(-50%,-50%)",
        width:Math.round(420*vscale), height:Math.round(420*vscale), borderRadius:"50%",
        background:"radial-gradient(circle at 48% 44%, rgba(255,255,255,0.07) 0%, rgba(10,30,20,0.55) 55%, rgba(4,16,10,0.82) 100%)",
        border:"2px solid rgba(255,255,255,0.11)",
        boxShadow:"0 0 80px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.25), 0 0 0 8px rgba(255,255,255,0.025)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, zIndex:10,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {/* Deck */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div className={`card pile-card card-back ${mustDraw?"draw-pile-must":isMyTurn&&gameState.pendingDrawCount===0?"draw-pile":"draw-pile-off"}`}
              style={{ cursor:(mustDraw||(isMyTurn&&gameState.pendingDrawCount===0))&&!acting?"pointer":"default" }}
              onClick={() => { if ((mustDraw||(isMyTurn&&gameState.pendingDrawCount===0))&&!acting) sendAction({ type:"draw" }); }}>
              <div className="card-face"><div className="card-oval"/><span className="card-back-label">ZUNO</span></div>
            </div>
            <span style={{ fontSize:"0.6rem", color:"#374151" }}>{gameState.deck}</span>
          </div>
          {/* Direction */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div className="dir-ring" style={{ transform:`rotate(${gameState.direction===1?0:180}deg)` }}>↻</div>
            {gameState.pendingDrawCount > 0 && <span className="pending-badge">+{gameState.pendingDrawCount}</span>}
          </div>
          {/* Discard */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <UnoCard key={`${top.id}-${newCardAnim}`} card={top} size="pile" className="card-land" />
            <div className="color-chip" style={{ background:COLOR_DOT[gameState.currentColor]+"22", color:COLOR_DOT[gameState.currentColor] }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:COLOR_DOT[gameState.currentColor], display:"inline-block", flexShrink:0 }} />
              {COLOR_NAME[gameState.currentColor]}
            </div>
          </div>
        </div>
        {/* Statut */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:"0.85rem", fontWeight:800, whiteSpace:"nowrap", color:isMyTurn?"#f59e0b":"#64748b", padding:"5px 18px", borderRadius:999, background:isMyTurn?"rgba(245,158,11,0.13)":"rgba(255,255,255,0.04)", border:`1px solid ${isMyTurn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.07)"}`, transition:"all 0.4s", display:"flex", alignItems:"center", gap:8 }}>
            {isMyTurn ? (
              <>
                <span>🫵 Votre tour</span>
                <span style={{ fontSize:"0.75rem", fontWeight:900, color: timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#f59e0b", background:"rgba(0,0,0,0.3)", borderRadius:999, padding:"1px 8px", minWidth:28, textAlign:"center", transition:"color 0.3s" }}>{timeLeft}s</span>
              </>
            ) : `Au tour de ${gameState.players[gameState.currentPlayerIndex]?.name}…`}
          </div>
          <div key={logKey} className="log-badge">{gameState.lastAction}</div>
        </div>
      </div>

      {/* MAIN DU JOUEUR */}
      <div style={{
        position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)",
        zIndex:30, width:"min(100%, 900px)", background:"rgba(4,10,20,0.97)",
        borderTop:`2px solid ${isMyTurn?"rgba(245,158,11,0.45)":"rgba(255,255,255,0.07)"}`,
        borderLeft:`2px solid ${isMyTurn?"rgba(245,158,11,0.45)":"rgba(255,255,255,0.07)"}`,
        borderRight:`2px solid ${isMyTurn?"rgba(245,158,11,0.45)":"rgba(255,255,255,0.07)"}`,
        borderBottom:"none", borderRadius:"16px 16px 0 0", transition:"border-color 0.4s",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div className={`avatar${isMyTurn?" active":""}`} style={{ background:"#10b981", width:30, height:30, fontSize:"0.75rem" }}>V</div>
            <span style={{ fontSize:"0.8rem", fontWeight:700, color:isMyTurn?"#f1f5f9":"#94a3b8" }}>
              Vous <span style={{ fontWeight:500, color:"#64748b" }}>· {me?.hand.length ?? 0} carte{(me?.hand.length??0)!==1?"s":""}</span>
            </span>
            {canCounter && (
              <button className="draw-btn" style={{ marginLeft:6 }} onClick={() => !acting && sendAction({ type:"draw" })}>
                Piocher +{gameState.pendingDrawCount} (ou contrer)
              </button>
            )}
            {mustDraw && gameState.pendingDrawCount > 0 && !canCounter && (
              <button className="draw-btn" style={{ marginLeft:6 }} onClick={() => !acting && sendAction({ type:"draw" })}>
                Piocher +{gameState.pendingDrawCount}
              </button>
            )}
          </div>
          {!isMyTurn && <span style={{ fontSize:"0.68rem", color:"#1e293b" }}>En attente…</span>}
        </div>
        <div ref={handScrollCallbackRef} style={{ overflowX:"auto", scrollbarWidth:"none" }}>
          <div style={{ display:"flex", gap:7, alignItems:"flex-end", minWidth:"max-content", padding:"16px 18px" }}>
            <AnimatePresence initial={false} mode="popLayout">
              {(me?.hand ?? []).map((card) => {
                const p = playableIds.has(card.id);
                return (
                  <motion.div key={card.id} data-card-id={card.id}
                    initial={{ opacity:0, y:30, scale:0.85 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, scale:0.7, transition:{ duration:0.1 } }}
                    transition={{ duration:0.3, ease:[0.34,1.56,0.64,1] }}
                    style={{ flexShrink:0 }}>
                    <UnoCard card={card} size="hand" playable={p} disabled={isMyTurn && !p} onClick={p && !acting ? () => handlePlay(card.id) : undefined} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
