"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, CardColor, Card } from "@/lib/uno/types";
import { initGame, playCard, drawCards, aiPlay, pickColor, canPlay, topCard, colorName } from "@/lib/uno/game";
import UnoCard from "@/components/UnoCard";
import ColorPicker from "@/components/ColorPicker";

const AI_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "Gabriel", "Hannah", "Ivan"];
const AVATAR_BG = ["#8b5cf6","#ec4899","#f97316","#06b6d4","#84cc16","#f43f5e","#a855f7","#14b8a6","#fb923c"];
const COLOR_DOT: Record<CardColor, string> = {
  red: "#ff5252", green: "#66bb6a", blue: "#42a5f5", yellow: "#fff176", wild: "#c084fc",
};

function CardStack({ count, active }: { count: number; active: boolean }) {
  const n = Math.min(count, 7);
  return (
    <div style={{ position: "relative", width: 20 + n * 4, height: 38, flexShrink: 0 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", right: i * 4, top: i * 0.8, width: 22, height: 34, borderRadius: 5,
          background: active ? "linear-gradient(145deg,#3b5080,#1e3263)" : "linear-gradient(145deg,#243044,#161f30)",
          border: `1px solid ${active ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.09)"}`,
          zIndex: i, transition: "border-color 0.3s",
        }} />
      ))}
    </div>
  );
}

function TurnTimer({ timeLeft }: { timeLeft: number }) {
  const r = 18, circ = 2 * Math.PI * r;
  const offset = circ * (1 - timeLeft / 30);
  const isAlert = timeLeft <= 3;
  const color = isAlert ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#22c55e";
  return (
    <div className={isAlert ? "timer-alert" : ""} style={{ position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>{timeLeft}</div>
    </div>
  );
}

function FlyingCard({ card, fromX, fromY, toX, toY, faceDown, onDone }: { card: Card; fromX: number; fromY: number; toX: number; toY: number; faceDown: boolean; onDone: () => void }) {
  return (
    <motion.div
      initial={{ x: fromX, y: fromY, scale: 1, opacity: 1, rotate: 0 }}
      animate={{ x: toX, y: toY, scale: [1, 1.45, 1.1], opacity: 1, rotate: [0, -8, 3, 0] }}
      transition={{ duration: 0.52, ease: [0.25, 0.46, 0.45, 0.94], times: [0, 0.45, 1] }}
      onAnimationComplete={onDone}
      style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none", width: 80, height: 116, filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.7))" }}
    >
      <UnoCard card={card} size="pile" faceDown={faceDown} />
    </motion.div>
  );
}

export default function ZunoGame() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [numAI, setNumAI] = useState(1);
  const [state, setState] = useState<GameState | null>(null);
  const [vscale, setVscale] = useState(1);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [logKey, setLogKey] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [fanPlayed, setFanPlayed] = useState<string | null>(null);
  type FlyState = { card: Card; fromX: number; fromY: number; toX: number; toY: number; faceDown?: boolean };
  const [flyHuman, setFlyHuman] = useState<FlyState | null>(null);
  const [flyAI, setFlyAI] = useState<FlyState | null>(null);
  const aiDrawQueueRef = useRef<{ toX: number; toY: number; remaining: number } | null>(null);
  const aiDrawKeyRef = useRef(0);
  const [humanMultiDraw, setHumanMultiDraw] = useState<{ fromX: number; fromY: number; toX: number; toY: number; key: number } | null>(null);
  const humanDrawQueueRef = useRef<{ fromX: number; fromY: number; toX: number; toY: number; remaining: number } | null>(null);
  const humanDrawKeyRef = useRef(0);
  const [drawFly, setDrawFly] = useState<{ deckX: number; deckY: number; cardX: number; cardY: number; cardId: string } | null>(null);
  const [drawnHiddenId, setDrawnHiddenId] = useState<string | null>(null);
  const [drawnFlipId, setDrawnFlipId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const pendingDrawFlyRef = useRef<{ deckX: number; deckY: number; newCardId: string } | null>(null);
  const prevHandRef = useRef<string[]>([]);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const discardRef = useRef<HTMLDivElement>(null);
  const playerZoneRefs = useRef<(HTMLDivElement | null)[]>(Array(9).fill(null));
  const handScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setVscale(Math.min(window.innerWidth / 1366, window.innerHeight / 768, 1));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`zuno_${id}`);
      if (raw) {
        const config = JSON.parse(raw);
        setNumAI(config.numAI);
        startGameWith(config.numAI);
      } else {
        router.replace("/hub/zuno");
      }
    } catch {
      router.replace("/hub/zuno");
    }
  }, [id]);

  const handScrollCallbackRef = (el: HTMLDivElement | null) => {
    if (handScrollRef.current) handScrollRef.current.removeEventListener("wheel", (handScrollRef.current as any)._wheelHandler);
    (handScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); el.scrollLeft += e.deltaY + e.deltaX; };
    (el as any)._wheelHandler = handler;
    el.addEventListener("wheel", handler, { passive: false });
  };

  function update(next: GameState) { setState(next); setLogKey((k) => k + 1); }

  function startGameWith(n: number) {
    prevHandRef.current = [];
    setAiThinking(false); setFlyHuman(null); setFlyAI(null);
    setDrawFly(null); setDrawnHiddenId(null); setDrawnFlipId(null);
    update(initGame(["Vous", ...AI_NAMES.slice(0, n)]));
  }

  function startAIDrawAnimation(toX: number, toY: number, count: number) {
    if (count <= 0) return;
    const deckEl = deckRef.current;
    if (!deckEl) return;
    const from = deckEl.getBoundingClientRect();
    aiDrawQueueRef.current = { toX, toY, remaining: count - 1 };
    aiDrawKeyRef.current += 1;
    setFlyAI({ card: { id: `_ai_draw_${aiDrawKeyRef.current}`, color: "wild", value: "wild" }, fromX: from.left, fromY: from.top, toX, toY, faceDown: true });
  }

  function restartGame() {
    const newId = crypto.randomUUID();
    sessionStorage.setItem(`zuno_${newId}`, JSON.stringify({ numAI }));
    router.replace(`/hub/zuno/${newId}`);
  }

  useEffect(() => {
    if (!state || state.phase !== "playing" || confirmQuit) return;
    const cur = state.players[state.currentPlayerIndex];
    if (!cur.isAI) return;
    const playingIdx = state.currentPlayerIndex;
    setAiThinking(true);
    aiTimer.current = setTimeout(() => {
      setAiThinking(false);
      setState((prev) => {
        if (!prev) return prev;
        const next = aiPlay(prev);
        setLogKey((k) => k + 1);
        setFanPlayed(cur.id);
        setTimeout(() => setFanPlayed(null), 500);
        const prevTop = topCard(prev), nextTop = topCard(next);
        const prevHandLen = prev.players[playingIdx].hand.length;
        const nextHandLen = next.players[playingIdx].hand.length;
        if (nextTop.id !== prevTop.id) {
          setTimeout(() => {
            const aiZone = playerZoneRefs.current[playingIdx - 1];
            const discardEl = discardRef.current;
            if (aiZone && discardEl) {
              const from = aiZone.getBoundingClientRect(), to = discardEl.getBoundingClientRect();
              setFlyAI({ card: nextTop, fromX: from.left + from.width / 2 - 40, fromY: from.top + from.height / 2 - 58, toX: to.left, toY: to.top });
            }
          }, 0);
        } else if (nextHandLen > prevHandLen) {
          const drawnCount = nextHandLen - prevHandLen;
          setTimeout(() => {
            const aiZone = playerZoneRefs.current[playingIdx - 1];
            if (aiZone) {
              const to = aiZone.getBoundingClientRect();
              startAIDrawAnimation(to.left + to.width / 2 - 40, to.top + to.height / 2 - 58, drawnCount);
            }
          }, 0);
        }
        return next;
      });
    }, 700 + Math.random() * 1200);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [state, confirmQuit]);

  useEffect(() => {
    if (!state || state.phase !== "playing" || state.currentPlayerIndex !== 0 || state.pendingDrawCount === 0 || confirmQuit) return;
    const human = state.players[0];
    if (!human.hand.some((c) => canPlay(c, state))) {
      const t = setTimeout(() => setState((prev) => prev ? drawCards(prev) : prev), 700);
      return () => clearTimeout(t);
    }
  }, [state, confirmQuit]);

  useEffect(() => {
    if (state?.phase === "playing" && state.currentPlayerIndex === 0 && !confirmQuit) setTimeLeft(30);
    else setTimeLeft(null);
  }, [state?.currentPlayerIndex, state?.phase, confirmQuit]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft === 0) {
      setState((prev) => { if (!prev || prev.currentPlayerIndex !== 0 || prev.phase !== "playing") return prev; return drawCards(prev); });
      setLogKey((k) => k + 1); return;
    }
    const t = setTimeout(() => setTimeLeft((n) => (n !== null ? n - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => { if (!state) return; prevHandRef.current = state.players[0].hand.map((c) => c.id); }, [state]);

  useEffect(() => {
    if (!pendingDrawFlyRef.current || !state) return;
    const { deckX, deckY, newCardId } = pendingDrawFlyRef.current;
    pendingDrawFlyRef.current = null;
    requestAnimationFrame(() => {
      const cardEl = document.querySelector<HTMLElement>(`[data-card-id="${newCardId}"]`);
      if (cardEl) { const rect = cardEl.getBoundingClientRect(); setDrawFly({ deckX, deckY, cardX: rect.left, cardY: rect.top, cardId: newCardId }); }
      else setDrawnHiddenId(null);
    });
  }, [state]);

  if (!state) return null;

  if (state.phase === "won") {
    const isMe = state.winner === "Vous";
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <div style={{ width: 72, height: 72, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: isMe ? "rgba(245,158,11,0.1)" : "rgba(148,163,184,0.08)", border: `1px solid ${isMe ? "rgba(245,158,11,0.3)" : "rgba(148,163,184,0.15)"}` }}>
          {isMe
            ? <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
        </div>
        <h2 className="text-4xl font-black" style={{ color: isMe ? "#f59e0b" : "#94a3b8" }}>
          {isMe ? "Vous avez gagné !" : `${state.winner} a gagné !`}
        </h2>
        <p className="text-slate-500 text-sm">{isMe ? "Bien joué !" : "Meilleure chance la prochaine fois"}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={restartGame} className="btn-primary">Rejouer</button>
          <a href="/hub/zuno" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Menu</a>
        </div>
      </main>
    );
  }

  const human = state.players[0];
  const isHumanTurn = state.currentPlayerIndex === 0 && state.phase === "playing";
  const isHumanPickingColor = state.currentPlayerIndex === 0 && state.phase === "picking-color";
  const top = topCard(state);
  const playableIds = new Set(isHumanTurn ? human.hand.filter((c) => canPlay(c, state)).map((c) => c.id) : []);
  const canCounter = isHumanTurn && state.pendingDrawCount > 0 && human.hand.some((c) => canPlay(c, state));
  const mustDraw = isHumanTurn && playableIds.size === 0;

  function handleHumanDraw() {
    if (!state) return;
    const deckRect = deckRef.current?.getBoundingClientRect();
    if (deckRect && state.pendingDrawCount === 0) {
      // Draw 1 card — fly it to its position in hand
      const next = drawCards(state);
      const prevIds = new Set(state.players[0].hand.map((c) => c.id));
      const newCard = next.players[0].hand.find((c) => !prevIds.has(c.id));
      if (newCard) { pendingDrawFlyRef.current = { deckX: deckRect.left, deckY: deckRect.top, newCardId: newCard.id }; setDrawnHiddenId(newCard.id); }
      update(next);
    } else {
      // Draw N cards — animate them one by one toward the hand area
      const count = state.pendingDrawCount;
      const handEl = handScrollRef.current;
      if (deckRect && handEl && count > 0) {
        const to = handEl.getBoundingClientRect();
        const toX = to.left + to.width / 2 - 40;
        const toY = to.top + 10;
        humanDrawQueueRef.current = { fromX: deckRect.left, fromY: deckRect.top, toX, toY, remaining: count - 1 };
        humanDrawKeyRef.current += 1;
        setHumanMultiDraw({ fromX: deckRect.left, fromY: deckRect.top, toX, toY, key: humanDrawKeyRef.current });
      }
      update(drawCards(state));
    }
  }

  function handleHumanPlay(cardId: string) {
    if (!state) return;
    const cardEl = document.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`);
    const discardEl = discardRef.current;
    if (cardEl && discardEl) {
      const from = cardEl.getBoundingClientRect(), to = discardEl.getBoundingClientRect();
      const card = state.players[0].hand.find((c) => c.id === cardId)!;
      setFlyHuman({ card, fromX: from.left, fromY: from.top, toX: to.left, toY: to.top });
    }
    update(playCard(state, cardId));
  }

  const aiBadgeW = Math.round((numAI <= 4 ? 200 : numAI <= 6 ? 170 : 145) * vscale);
  const aiBadgeH = Math.round(120 * vscale);
  const aiRadius = Math.round(320 * vscale);
  const totalArc = Math.min(numAI * 34, 290);
  const arcMid = -90, arcStart = arcMid - totalArc / 2, arcEnd = arcMid + totalArc / 2;

  const aiAbsPos = Array.from({ length: numAI }, (_, i) => {
    const deg = numAI === 1 ? -90 : arcStart + (arcEnd - arcStart) * i / (numAI - 1);
    const rad = (deg * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * aiRadius), y = Math.round(Math.sin(rad) * aiRadius);
    return { left: `calc(50% + ${x}px - ${aiBadgeW / 2}px)`, top: `calc(46% + ${y}px - ${aiBadgeH / 2}px)` };
  });

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {isHumanPickingColor && <ColorPicker onPick={(c: CardColor) => update(pickColor(state, c))} />}
      {!confirmQuit && humanMultiDraw && <FlyingCard key={humanMultiDraw.key} card={{ id: `_human_draw_${humanMultiDraw.key}`, color: "wild", value: "wild" }} fromX={humanMultiDraw.fromX} fromY={humanMultiDraw.fromY} toX={humanMultiDraw.toX} toY={humanMultiDraw.toY} faceDown={true} onDone={() => {
        const q = humanDrawQueueRef.current;
        if (q && q.remaining > 0) {
          const deckEl = deckRef.current;
          if (deckEl) {
            const from = deckEl.getBoundingClientRect();
            humanDrawQueueRef.current = { ...q, remaining: q.remaining - 1 };
            humanDrawKeyRef.current += 1;
            setHumanMultiDraw({ fromX: from.left, fromY: from.top, toX: q.toX, toY: q.toY, key: humanDrawKeyRef.current });
          } else { humanDrawQueueRef.current = null; setHumanMultiDraw(null); }
        } else { humanDrawQueueRef.current = null; setHumanMultiDraw(null); }
      }} />}
      {!confirmQuit && flyHuman && <FlyingCard card={flyHuman.card} fromX={flyHuman.fromX} fromY={flyHuman.fromY} toX={flyHuman.toX} toY={flyHuman.toY} faceDown={false} onDone={() => setFlyHuman(null)} />}
      {!confirmQuit && flyAI && <FlyingCard key={flyAI.card.id} card={flyAI.card} fromX={flyAI.fromX} fromY={flyAI.fromY} toX={flyAI.toX} toY={flyAI.toY} faceDown={flyAI.faceDown ?? false} onDone={() => {
        const q = aiDrawQueueRef.current;
        if (q && q.remaining > 0) {
          const deckEl = deckRef.current;
          if (deckEl) {
            const from = deckEl.getBoundingClientRect();
            aiDrawQueueRef.current = { ...q, remaining: q.remaining - 1 };
            aiDrawKeyRef.current += 1;
            setFlyAI({ card: { id: `_ai_draw_${aiDrawKeyRef.current}`, color: "wild", value: "wild" }, fromX: from.left, fromY: from.top, toX: q.toX, toY: q.toY, faceDown: true });
          } else { aiDrawQueueRef.current = null; setFlyAI(null); }
        } else { aiDrawQueueRef.current = null; setFlyAI(null); }
      }} />}
      {!confirmQuit && drawFly && <FlyingCard card={{ id: "_draw", color: "wild", value: "wild" }} fromX={drawFly.deckX} fromY={drawFly.deckY} toX={drawFly.cardX} toY={drawFly.cardY} faceDown={true} onDone={() => { const cid = drawFly.cardId; setDrawFly(null); setDrawnHiddenId(null); setDrawnFlipId(cid); setTimeout(() => setDrawnFlipId(null), 400); }} />}
      {timeLeft !== null && timeLeft <= 3 && <div className="danger-overlay" />}

      {/* TOPBAR */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 50 }}>
        <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-1px", background: "linear-gradient(120deg,#fbbf24,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Z-HUB</span>
        <button onClick={() => setConfirmQuit(true)} style={{
          color: "#ef4444", fontSize: "0.75rem", padding: "5px 12px", borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)",
          display: "inline-flex", alignItems: "center", gap: 6,
          transition: "border-color 0.15s, background 0.15s", cursor: "pointer", fontFamily: "inherit",
        }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(239,68,68,0.14)"; el.style.borderColor = "rgba(239,68,68,0.4)"; }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(239,68,68,0.06)"; el.style.borderColor = "rgba(239,68,68,0.2)"; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Quitter
        </button>
      </div>

      {/* Modal confirmation quitter */}
      {confirmQuit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 36px", textAlign: "center", maxWidth: 320 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>Tu veux vraiment quitter ?</p>
            <p style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 24 }}>La partie en cours sera perdue.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmQuit(false)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <a href="/hub" style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 800, color: "#fff", background: "#ef4444", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Quitter</a>
            </div>
          </div>
        </div>
      )}

      {/* BADGES IA */}
      {state.players.slice(1).map((player, i) => {
        const isCurrent = state.currentPlayerIndex === i + 1;
        const count = player.hand.length;
        const fanCount = Math.min(count, 9), fanSpacing = 14, cardW = 32, cardH = 46;
        return (
          <div key={player.id} ref={(el) => { playerZoneRefs.current[i] = el; }} style={{
            position: "absolute", ...aiAbsPos[i], zIndex: 20,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
            padding: "8px 10px 10px", width: aiBadgeW,
            background: isCurrent ? "rgba(245,158,11,0.07)" : "rgba(6,12,24,0.88)",
            border: `1.5px solid ${isCurrent ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 20, backdropFilter: "blur(16px)",
            boxShadow: isCurrent ? "0 0 28px rgba(245,158,11,0.22),0 8px 24px rgba(0,0,0,0.65)" : "0 4px 20px rgba(0,0,0,0.6)",
            transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className={`avatar${isCurrent ? " active" : ""}`} style={{ background: AVATAR_BG[i], width: 30, height: 30, fontSize: "0.72rem", flexShrink: 0 }}>{player.name[0]}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: isCurrent ? "#f59e0b" : "#cbd5e1", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: aiBadgeW - 60 }}>{player.name}</div>
                <div style={{ fontSize: "0.55rem", color: isCurrent ? "#d97706" : "#475569" }}>{count} carte{count !== 1 ? "s" : ""}</div>
              </div>
              {isCurrent && aiThinking && <div className="thinking-dots" style={{ transform: "scale(0.65)", flexShrink: 0 }}><div className="thinking-dot"/><div className="thinking-dot"/><div className="thinking-dot"/></div>}
            </div>
            <div style={{ position: "relative", width: aiBadgeW - 20, height: cardH + 6 }}>
              {Array.from({ length: fanCount }).map((_, j) => {
                const center = (fanCount - 1) / 2, offset = (j - center) * fanSpacing, rot = (j - center) * 3, yUp = Math.abs(j - center) * 0.6;
                return <div key={j} style={{ position: "absolute", left: `calc(50% + ${offset}px - ${cardW / 2}px)`, top: yUp, transform: `rotate(${rot}deg)`, transformOrigin: "bottom center", filter: isCurrent ? "brightness(1.15)" : "brightness(0.7)", transition: "filter 0.3s" }}><UnoCard card={{ id: `back-${j}`, color: "wild", value: "wild" }} size="mini" faceDown={true} /></div>;
              })}
            </div>
          </div>
        );
      })}

      {/* TABLE CENTRALE */}
      <div style={{
        position: "absolute", top: "46%", left: "50%", transform: "translate(-50%,-50%)",
        width: Math.round(420 * vscale), height: Math.round(420 * vscale), borderRadius: "50%",
        background: "radial-gradient(circle at 48% 44%, rgba(255,255,255,0.07) 0%, rgba(10,30,20,0.55) 55%, rgba(4,16,10,0.82) 100%)",
        border: "2px solid rgba(255,255,255,0.11)",
        boxShadow: "0 0 80px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.25), 0 0 0 8px rgba(255,255,255,0.025)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div ref={deckRef} className={`card pile-card card-back ${mustDraw ? "draw-pile-must" : isHumanTurn && state.pendingDrawCount === 0 ? "draw-pile" : "draw-pile-off"}`} onClick={mustDraw || (isHumanTurn && state.pendingDrawCount === 0) ? handleHumanDraw : undefined}>
              <div className="card-face"><div className="card-oval"/><span className="card-back-label">ZUNO</span></div>
            </div>
            <span style={{ fontSize: "0.6rem", color: "#374151" }}>{state.deck.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div className="dir-ring" style={{ transform: `rotate(${state.direction === 1 ? 0 : 180}deg)` }}>↻</div>
            {state.pendingDrawCount > 0 && <span className="pending-badge">+{state.pendingDrawCount}</span>}
          </div>
          <div ref={discardRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <UnoCard key={top.id} card={top} size="pile" className={flyHuman || flyAI ? "" : "card-land"} />
            <div className="color-chip" style={{ background: COLOR_DOT[state.currentColor] + "22", color: COLOR_DOT[state.currentColor] }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR_DOT[state.currentColor], display: "inline-block", flexShrink: 0 }} />
              {colorName(state.currentColor)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, whiteSpace: "nowrap", color: isHumanTurn ? "#f59e0b" : "#64748b", padding: "5px 18px", borderRadius: 999, background: isHumanTurn ? "rgba(245,158,11,0.13)" : "rgba(255,255,255,0.04)", border: `1px solid ${isHumanTurn ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.4s" }}>
            {isHumanTurn ? "🫵 Votre tour" : `Au tour de ${state.players[state.currentPlayerIndex].name}…`}
          </div>
          <div key={logKey} className="log-badge">{state.lastAction}</div>
        </div>
      </div>

      {/* MAIN DU JOUEUR */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        zIndex: 30, width: "min(100%, 900px)", background: "rgba(4,10,20,0.97)",
        borderTop: `2px solid ${isHumanTurn ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `2px solid ${isHumanTurn ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}`,
        borderRight: `2px solid ${isHumanTurn ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}`,
        borderBottom: "none", borderRadius: "16px 16px 0 0", transition: "border-color 0.4s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={`avatar${isHumanTurn ? " active" : ""}`} style={{ background: "#10b981", width: 30, height: 30, fontSize: "0.75rem" }}>V</div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isHumanTurn ? "#f1f5f9" : "#94a3b8" }}>Vous <span style={{ fontWeight: 500, color: "#64748b" }}>· {human.hand.length} carte{human.hand.length !== 1 ? "s" : ""}</span></span>
            {canCounter && <button className="draw-btn" style={{ marginLeft: 6 }} onClick={handleHumanDraw}>Piocher {state.pendingDrawCount} (ou contrer)</button>}
          </div>
          {isHumanTurn && timeLeft !== null ? <TurnTimer timeLeft={timeLeft} /> : <span style={{ fontSize: "0.68rem", color: "#1e293b" }}>En attente…</span>}
        </div>
        <div ref={handScrollCallbackRef} style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          <div style={{ display: "flex", gap: 7, alignItems: "flex-end", minWidth: "max-content", padding: "16px 18px" }}>
            <AnimatePresence initial={false} mode="popLayout">
              {human.hand.map((card) => {
                const p = playableIds.has(card.id);
                return (
                  <motion.div key={card.id} data-card-id={card.id}
                    initial={{ opacity: 0, y: 30, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ flexShrink: 0, visibility: drawnHiddenId === card.id ? "hidden" : "visible" }}
                  >
                    <div className={drawnFlipId === card.id ? "card-flip-reveal" : ""}>
                      <UnoCard card={card} size="hand" playable={p} disabled={isHumanTurn && !p} onClick={p ? () => handleHumanPlay(card.id) : undefined} />
                    </div>
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
