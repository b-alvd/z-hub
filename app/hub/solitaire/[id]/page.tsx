"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Suit = 0 | 1 | 2 | 3;
interface Card { suit: Suit; rank: number; faceUp: boolean }

const SYM = ["♠", "♥", "♦", "♣"];
const CLR = ["#1e293b", "#dc2626", "#dc2626", "#1e293b"];
const RNK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const CW = 106;
const CH = 150;
const OVD = 22;
const OVU = 34;

const isRed = (s: Suit) => s === 1 || s === 2;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

interface GS {
  id: string;
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  moves: number;
  won: boolean;
  elapsed: number;
}

function initGame(): GS {
  const deck = shuffle(
    Array.from({ length: 52 }, (_, i) => ({
      suit: Math.floor(i / 13) as Suit,
      rank: (i % 13) + 1,
      faceUp: false,
    }))
  );
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);
  let i = 0;
  for (let col = 0; col < 7; col++)
    for (let row = 0; row <= col; row++)
      tableau[col].push({ ...deck[i++], faceUp: row === col });
  return {
    id: Math.random().toString(36).slice(2),
    tableau,
    foundations: [[], [], [], []] as Card[][],
    stock: deck.slice(i),
    waste: [],
    moves: 0,
    won: false,
    elapsed: 0,
  };
}

function isValidGS(gs: GS): boolean {
  if (!gs.foundations || gs.foundations.length !== 4) return false;
  if (gs.won) return false; // don't restore a finished game
  for (let p = 0; p < 4; p++)
    for (const card of gs.foundations[p])
      if (card.suit !== p) return false;
  return true;
}

function loadGame(saveKey: string): GS {
  if (typeof window === "undefined") return initGame();
  try {
    const raw = localStorage.getItem(saveKey);
    if (raw) {
      const gs = JSON.parse(raw);
      if (isValidGS(gs)) return gs;
    }
  } catch {}
  return initGame();
}

function saveGame(gs: GS, saveKey: string) {
  try { localStorage.setItem(saveKey, JSON.stringify(gs)); } catch {}
}

type Sel = { from: "tab"; col: number; idx: number } | { from: "waste" } | null;
type DropTarget = { to: "f"; p: number } | { to: "t"; col: number };

const canF = (c: Card, pile: Card[], p: number) =>
  c.suit === p && (pile.length === 0 ? c.rank === 1 : pile.at(-1)!.rank === c.rank - 1);

const canT = (c: Card, col: Card[]) =>
  col.length === 0
    ? c.rank === 13
    : col.at(-1)!.faceUp && isRed(col.at(-1)!.suit) !== isRed(c.suit) && col.at(-1)!.rank === c.rank + 1;


function findAllHints(gs: GS): Sel[] {
  const hints: Sel[] = [];
  const wt = gs.waste.at(-1);

  // 1. waste → foundation
  if (wt && canF(wt, gs.foundations[wt.suit], wt.suit)) hints.push({ from: "waste" });

  // 2. tableau → foundation
  for (let col = 0; col < 7; col++) {
    const c = gs.tableau[col];
    const card = c.at(-1);
    if (card?.faceUp && canF(card, gs.foundations[card.suit], card.suit))
      hints.push({ from: "tab", col, idx: c.length - 1 });
  }

  // 3. moves that reveal a face-down card
  for (let col = 0; col < 7; col++) {
    const c = gs.tableau[col];
    for (let i = 0; i < c.length; i++) {
      if (!c[i].faceUp) continue;
      if (i > 0 && !c[i - 1].faceUp) {
        for (let tc = 0; tc < 7; tc++) {
          if (tc !== col && canT(c[i], gs.tableau[tc])) hints.push({ from: "tab", col, idx: i });
        }
      }
    }
  }

  // 4. waste → tableau (only if it reveals something or is a useful card)
  if (wt) {
    for (let col = 0; col < 7; col++) {
      if (canT(wt, gs.tableau[col])) hints.push({ from: "waste" });
    }
  }

  // 5. stock cards that can be played somewhere useful
  const stockAndWaste = [...gs.waste.slice(0, -1).reverse(), ...gs.stock];
  const hasPlayableInStock = stockAndWaste.some(card =>
    canF(card, gs.foundations[card.suit], card.suit) ||
    gs.tableau.some(col => canT(card, col))
  );
  if (hasPlayableInStock) hints.push({ from: "waste" });

  return hints;
}

function doMove(s: GS, sel: Sel, cards: Card[], target: DropTarget): GS {
  const ns: GS = {
    ...s,
    tableau: s.tableau.map(c => [...c]),
    foundations: s.foundations.map(c => [...c]),
    waste: [...s.waste],
    moves: s.moves + 1,
    won: false,
  };
  if (sel!.from === "waste") {
    ns.waste.pop();
  } else {
    ns.tableau[sel!.col].splice(sel!.idx);
    const col = ns.tableau[sel!.col];
    if (col.length > 0 && !col.at(-1)!.faceUp)
      col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
  }
  if (target.to === "f") ns.foundations[target.p].push(...cards);
  else ns.tableau[target.col].push(...cards);
  ns.won = ns.foundations.every(f => f.length === 13);
  return ns;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─── Card components ───────────────────────────────────────────────

function CardFaceSimple({ card, opacity = 1 }: { card: Card; opacity?: number }) {
  const c = CLR[card.suit];
  const s = SYM[card.suit];
  const r = RNK[card.rank];
  return (
    <div style={{
      width: CW, height: CH, borderRadius: 9, flexShrink: 0,
      background: "linear-gradient(160deg, #ffffff 0%, #f0f4f8 100%)",
      border: "1.5px solid rgba(0,0,0,0.09)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "5px 6px", opacity,
    }}>
      <div style={{ fontSize: "0.92rem", fontWeight: 900, color: c, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
        <div>{r}</div>
        <div style={{ fontSize: "0.78rem", marginTop: 1 }}>{s}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
        <span style={{ fontSize: "2.6rem", color: c, lineHeight: 1, opacity: 0.82 }}>{s}</span>
      </div>
      <div style={{ fontSize: "0.92rem", fontWeight: 900, color: c, lineHeight: 1.12, letterSpacing: "-0.01em", transform: "rotate(180deg)", alignSelf: "flex-end" }}>
        <div>{r}</div>
        <div style={{ fontSize: "0.78rem", marginTop: 1 }}>{s}</div>
      </div>
    </div>
  );
}

function CardFace({ card, selected, onClick, onDoubleClick, onPointerDown, delay = 0, ghost = false }: {
  card: Card; selected: boolean; onClick: () => void; onDoubleClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void; delay?: number; ghost?: boolean;
}) {
  const c = CLR[card.suit];
  const s = SYM[card.suit];
  const r = RNK[card.rank];
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.9 }}
      animate={{ opacity: ghost ? 0.22 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 34, delay }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick?.(); }}
      onPointerDown={onPointerDown}
      style={{
        width: CW, height: CH, borderRadius: 9, flexShrink: 0,
        background: selected
          ? "linear-gradient(160deg, #f0fdf4, #dcfce7)"
          : "linear-gradient(160deg, #ffffff 0%, #f0f4f8 100%)",
        border: `1.5px solid ${selected ? "#4ade80" : "rgba(0,0,0,0.09)"}`,
        boxShadow: selected
          ? "0 0 0 2.5px rgba(74,222,128,0.4), 0 8px 24px rgba(0,0,0,0.5)"
          : "0 3px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)",
        cursor: "grab", userSelect: "none",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "5px 6px",
        transition: "border-color 0.12s, box-shadow 0.12s, background 0.12s",
      }}
    >
      <div style={{ fontSize: "0.92rem", fontWeight: 900, color: c, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
        <div>{r}</div>
        <div style={{ fontSize: "0.78rem", marginTop: 1 }}>{s}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
        <span style={{ fontSize: "2.6rem", color: c, lineHeight: 1, opacity: 0.82 }}>{s}</span>
      </div>
      <div style={{ fontSize: "0.92rem", fontWeight: 900, color: c, lineHeight: 1.12, letterSpacing: "-0.01em", transform: "rotate(180deg)", alignSelf: "flex-end" }}>
        <div>{r}</div>
        <div style={{ fontSize: "0.78rem", marginTop: 1 }}>{s}</div>
      </div>
    </motion.div>
  );
}

function CardBack({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      onClick={onClick}
      style={{
        width: CW, height: CH, borderRadius: 9, flexShrink: 0,
        background: "linear-gradient(145deg, #1e4d7a 0%, #0f2f4e 100%)",
        border: "1.5px solid rgba(255,255,255,0.1)",
        boxShadow: "0 3px 8px rgba(0,0,0,0.45)",
        cursor: onClick ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", position: "relative",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: [
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.028) 0, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 9px)",
          "repeating-linear-gradient(-45deg, rgba(255,255,255,0.028) 0, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 9px)",
        ].join(", "),
      }} />
      <div style={{
        width: CW - 18, height: CH - 18, borderRadius: 5,
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "-1px" }}>Z</span>
      </div>
    </motion.div>
  );
}

function CardFlip({ card, isSelected, onClick, onDoubleClick, onPointerDown, delay = 0, ghost = false }: {
  card: Card; isSelected: boolean; onClick: () => void; onDoubleClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void; delay?: number; ghost?: boolean;
}) {
  const prevFaceUp = useRef(card.faceUp);
  const [flipping, setFlipping] = useState(false);
  const [displayFaceUp, setDisplayFaceUp] = useState(card.faceUp);

  useEffect(() => {
    if (card.faceUp && !prevFaceUp.current) {
      setFlipping(true);
      const t1 = setTimeout(() => setDisplayFaceUp(true), 100);
      const t2 = setTimeout(() => setFlipping(false), 200);
      prevFaceUp.current = true;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevFaceUp.current = card.faceUp;
  }, [card.faceUp]);

  return (
    <motion.div
      animate={{ rotateY: flipping ? 90 : 0, scale: flipping ? 0.97 : 1 }}
      transition={{ duration: 0.1 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {displayFaceUp
        ? <CardFace card={card} selected={isSelected} onClick={onClick} onDoubleClick={onDoubleClick}
            onPointerDown={onPointerDown} delay={delay} ghost={ghost} />
        : <CardBack />
      }
    </motion.div>
  );
}

function EmptySlot({ label, onClick, highlight = false }: { label?: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        width: CW, height: CH, borderRadius: 9, flexShrink: 0,
        border: `1.5px dashed ${highlight ? "rgba(74,222,128,0.55)" : "rgba(255,255,255,0.12)"}`,
        background: highlight ? "rgba(74,222,128,0.08)" : "transparent",
        boxShadow: highlight ? "0 0 0 2px rgba(74,222,128,0.18)" : "none",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 4, color: highlight ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.14)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
      }}
    >
      {label && <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{label}</span>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────

interface DragState {
  src: Sel;
  cardX: number;
  cardY: number;
  clickX: number;
  clickY: number;
  started: boolean;
}

export default function SolitairePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string | undefined;
  const saveKey = gameId ? `z-solitaire-${gameId}` : "z-solitaire-legacy";

  const [windowW, setWindowW] = useState(0);
  const [windowH, setWindowH] = useState(0);
  useEffect(() => {
    const update = () => { setWindowW(window.innerWidth); setWindowH(window.innerHeight); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const isMobile = windowW > 0 && windowW < 1024;
  const isPortrait = windowW > 0 && windowW < windowH;
  // In landscape mobile: fit game into available height (viewport minus header ~50px and bottom bar ~44px)
  // Game content height at scale=1: ~460px (top row 174 + gap 6 + tableau min 280)
  const gameScale = windowW > 0
    ? (!isPortrait && isMobile
        ? Math.min(1, windowW / 880, (windowH - 90) / 460)
        : Math.min(1, windowW / 880))
    : 1;

  const [gs, setGs] = useState<GS | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [dragSrc, setDragSrc] = useState<Sel>(null);
  const [dragCards, setDragCards] = useState<Card[]>([]);
  const [hoverTarget, setHoverTarget] = useState<DropTarget | null>(null);
  const [stuck, setStuck] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hintIndex = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const statRecorded = useRef(false);
  const gsRef = useRef(gs);
  const drag = useRef<DragState | null>(null);
  const wasDrag = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null, null, null]);

  // Load game state only on client (avoids SSR/client hydration mismatch from Math.random)
  useEffect(() => {
    setGs(loadGame(saveKey));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveKey]);

  useEffect(() => { if (gs) gsRef.current = gs; }, [gs]);

  // Track current game ID in localStorage so lobby can offer "Reprendre"
  useEffect(() => {
    if (gameId) {
      try { localStorage.setItem("z-solitaire-current", gameId); } catch {}
    }
  }, [gameId]);

  // Clear current game when over
  useEffect(() => {
    if (!gs) return;
    if (gs.won || stuck) {
      try { localStorage.removeItem("z-solitaire-current"); } catch {}
    }
  }, [gs?.won, stuck]);

  // Timer
  useEffect(() => {
    if (!gs) return;
    if (gs.won || stuck) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setGs(prev => {
        if (!prev) return prev;
        const next = { ...prev, elapsed: prev.elapsed + 1 };
        saveGame(next, saveKey);
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [gs?.won, gs?.id, stuck]);

  useEffect(() => { if (gs) saveGame(gs, saveKey); }, [gs?.moves, gs?.won]);

  useEffect(() => {
    if (!gs?.won || statRecorded.current) return;
    statRecorded.current = true;
    fetch("/api/stats/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "solitaire", won: true, elapsed: gs.elapsed, moves: gs.moves }),
    }).catch(() => {});
  }, [gs?.won]);

  useEffect(() => {
    if (!stuck || statRecorded.current) return;
    statRecorded.current = true;
    fetch("/api/stats/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "solitaire", won: false, elapsed: gs?.elapsed ?? 0, moves: gs?.moves ?? 0 }),
    }).catch(() => {});
  }, [stuck]);

  // Deadlock detection — check after each move, with a small delay for UX
  useEffect(() => {
    if (!gs) return;
    hintIndex.current = 0;
    if (gs.won) { setStuck(false); return; }
    if (gs.moves === 0) { setStuck(false); return; }
    const t = setTimeout(() => setStuck(findAllHints(gs).length === 0), 600);
    return () => clearTimeout(t);
  }, [gs?.moves, gs?.won, gs?.id]);

  // ─── Drag & drop ───────────────────────────────────────────────

  function startDrag(e: React.PointerEvent, src: Sel) {
    const s = gsRef.current;
    if (src === null) return;
    if (src.from === "waste" && !s.waste.length) return;
    if (src.from === "tab" && !s.tableau[src.col][src.idx]?.faceUp) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = {
      src, cardX: rect.left, cardY: rect.top,
      clickX: e.clientX, clickY: e.clientY, started: false,
    };
  }

  useEffect(() => {
    function getCards(s: GS, src: Sel): Card[] {
      if (!src) return [];
      if (src.from === "waste") return s.waste.length ? [s.waste.at(-1)!] : [];
      return s.tableau[src.col].slice(src.idx);
    }

    function findDrop(x: number, y: number, cards: Card[]): DropTarget | null {
      const s = gsRef.current;
      for (let p = 0; p < 4; p++) {
        const el = foundationRefs.current[p];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          if (cards.length === 1 && canF(cards[0], s.foundations[p], p)) return { to: "f", p };
        }
      }
      for (let col = 0; col < 7; col++) {
        const el = tabRefs.current[col];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          if (cards.length > 0 && canT(cards[0], s.tableau[col])) return { to: "t", col };
        }
      }
      return null;
    }

    function onMove(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.clickX;
      const dy = e.clientY - d.clickY;
      if (!d.started) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        d.started = true;
        // Read cards from current state and store in overlay-state
        const cards = getCards(gsRef.current, d.src);
        setDragCards(cards);
        setDragSrc(d.src);
        setSel(null);
        const ov = overlayRef.current;
        if (ov) {
          ov.style.display = "block";
          ov.style.opacity = "1";
          ov.style.transition = "none";
          ov.style.transform = `translate(${d.cardX}px, ${d.cardY}px)`;
        }
      }
      const newX = d.cardX + dx;
      const newY = d.cardY + dy;
      const rot = Math.max(-14, Math.min(14, dx * 0.045));
      const ov = overlayRef.current;
      if (ov) ov.style.transform = `translate(${newX}px, ${newY}px) rotate(${rot}deg)`;

      const cards = getCards(gsRef.current, d.src);
      setHoverTarget(findDrop(e.clientX, e.clientY, cards));
    }

    function onUp(e: PointerEvent) {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      setDragSrc(null);
      setHoverTarget(null);

      if (!d.started) return; // pure click — let onClick fire
      wasDrag.current = true;
      setTimeout(() => { wasDrag.current = false; }, 80);

      const s = gsRef.current;
      const cards = getCards(s, d.src);
      const target = findDrop(e.clientX, e.clientY, cards);
      const ov = overlayRef.current;

      if (target && ov) {
        // Snap to target then fade
        const targetEl = target.to === "f"
          ? foundationRefs.current[target.p]
          : tabRefs.current[target.col];
        let snapX = d.cardX, snapY = d.cardY;
        if (targetEl) {
          const r = targetEl.getBoundingClientRect();
          snapX = r.left;
          snapY = target.to === "t" && s.tableau[target.col].length > 0
            ? r.top + Math.min(r.height - CH, s.tableau[target.col].filter(c => c.faceUp).length * ovu)
            : r.top;
        }
        ov.style.transition = "transform 0.1s ease-out, opacity 0.08s ease";
        ov.style.transform = `translate(${snapX}px, ${snapY}px)`;
        ov.style.opacity = "0";
        setTimeout(() => { if (ov) { ov.style.display = "none"; ov.style.transition = "none"; } }, 140);

        const src = d.src;
        setGs(s2 => {
          const c2 = getCards(s2, src);
          if (!c2.length) return s2;
          return doMove(s2, src, c2, target);
        });
      } else if (ov) {
        // Spring back
        ov.style.transition = "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease";
        ov.style.transform = `translate(${d.cardX}px, ${d.cardY}px)`;
        ov.style.opacity = "0";
        setTimeout(() => { if (ov) { ov.style.display = "none"; ov.style.transition = "none"; } }, 400);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // ─── Click handlers ────────────────────────────────────────────

  function getSelCards(s: GS, curSel: Sel = sel): Card[] {
    if (!curSel) return [];
    if (curSel.from === "waste") return s.waste.length ? [s.waste.at(-1)!] : [];
    return s.tableau[curSel.col].slice(curSel.idx);
  }

  function tryAutoF(s: GS, curSel: Sel, cards: Card[]): GS | null {
    if (cards.length !== 1) return null;
    const p = cards[0].suit;
    if (canF(cards[0], s.foundations[p], p)) return doMove(s, curSel, cards, { to: "f", p });
    return null;
  }

  function clickStock() {
    if (wasDrag.current) return;
    setSel(null);
    setGs(s => {
      if (s.stock.length === 0)
        return { ...s, stock: [...s.waste].reverse().map(c => ({ ...c, faceUp: false })), waste: [], moves: s.moves + 1 };
      return { ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, { ...s.stock.at(-1)!, faceUp: true }], moves: s.moves + 1 };
    });
  }

  function clickWaste() {
    if (wasDrag.current) return;
    if (!gs.waste.length) return;
    if (sel?.from === "waste") { setSel(null); return; }
    setSel({ from: "waste" });
  }

  function dblClickWaste() {
    if (wasDrag.current) return;
    if (!gs.waste.length) return;
    const fakeSel: Sel = { from: "waste" };
    setGs(s => tryAutoF(s, fakeSel, getSelCards(s, fakeSel)) ?? s);
    setSel(null);
  }

  function clickFoundation(p: number) {
    if (wasDrag.current) return;
    if (!sel) return;
    const cards = getSelCards(gs);
    if (cards.length === 1 && canF(cards[0], gs.foundations[p], p)) {
      const captured = sel;
      setGs(s => doMove(s, captured, getSelCards(s, captured), { to: "f", p }));
      setSel(null);
    }
  }

  function clickTabCard(col: number, idx: number) {
    if (wasDrag.current) return;
    const card = gs.tableau[col][idx];
    if (!card.faceUp) return;
    if (!sel) { setSel({ from: "tab", col, idx }); return; }
    const cards = getSelCards(gs);
    if (cards.length > 0 && canT(cards[0], gs.tableau[col])) {
      const captured = sel;
      setGs(s => doMove(s, captured, getSelCards(s, captured), { to: "t", col }));
      setSel(null);
    } else {
      setSel({ from: "tab", col, idx });
    }
  }

  function dblClickTabCard(col: number, idx: number) {
    if (wasDrag.current) return;
    if (idx !== gs.tableau[col].length - 1) return;
    if (!gs.tableau[col][idx]?.faceUp) return;
    const fakeSel: Sel = { from: "tab", col, idx };
    setGs(s => {
      const cards = getSelCards(s, fakeSel);
      return tryAutoF(s, fakeSel, cards) ?? s;
    });
    setSel(null);
  }

  function clickEmptyCol(col: number) {
    if (wasDrag.current) return;
    if (!sel) return;
    const cards = getSelCards(gs);
    if (cards.length > 0 && canT(cards[0], [])) {
      const captured = sel;
      setGs(s => doMove(s, captured, getSelCards(s, captured), { to: "t", col }));
      setSel(null);
    }
  }

  function showHint() {
    if (gs.won || stuck) return;
    clearTimeout(hintTimer.current);
    const hints = findAllHints(gs);
    if (hints.length === 0) { setStuck(true); return; }
    const hint = hints[hintIndex.current % hints.length];
    hintIndex.current++;
    setHinting(true);
    setSel(hint);
    hintTimer.current = setTimeout(() => { setSel(null); setHinting(false); }, 1800);
  }

  function newGame() {
    clearInterval(tickRef.current);
    const newId = crypto.randomUUID();
    try { localStorage.setItem("z-solitaire-current", newId); } catch {}
    router.push(`/hub/solitaire/${newId}`);
  }

  function askNewGame() {
    setConfirmNew(true);
  }

  // Dynamic face-up overlap: compress if the tallest column would overflow available space
  const availTableauH = windowW > 0
    ? (windowH - (isMobile && !isPortrait ? 36 + 54 : 52 + 54)) / gameScale - (CH + (isMobile && !isPortrait ? 14 : 20)) - (isMobile && !isPortrait ? 6 : 12)
    : 600;
  const maxFaceUp = gs ? Math.max(...gs.tableau.map(col => col.filter(c => c.faceUp).length), 1) : 1;
  const maxFaceDown = gs ? Math.max(...gs.tableau.map(col => col.filter(c => !c.faceUp).length), 0) : 0;
  const neededH = maxFaceDown * OVD + Math.max(0, maxFaceUp - 1) * OVU + CH;
  const ovu = neededH > availTableauH
    ? Math.max(14, (availTableauH - maxFaceDown * OVD - CH) / Math.max(1, maxFaceUp - 1))
    : OVU;

  function colH(col: Card[]) {
    if (!col.length) return CH;
    return col.reduce((h, c, i) => i === col.length - 1 ? h + CH : h + (c.faceUp ? ovu : OVD), 0);
  }

  if (!gs) return null;

  const dealDelay = (col: number, row: number) => col * 0.038 + row * 0.022;
  const completedCount = gs.foundations.reduce((n, f) => n + f.length, 0);
  const progressPct = Math.round((completedCount / 52) * 100);

  // Helpers to determine ghosting
  function isCardGhosted(from: "tab" | "waste", col: number, idx: number): boolean {
    if (!dragSrc) return false;
    if (from === "waste") return dragSrc.from === "waste";
    if (dragSrc.from !== "tab") return false;
    return dragSrc.col === col && idx >= dragSrc.idx;
  }

  return (
    <main
      onClick={() => setSel(null)}
      style={{
        ...(isMobile && !isPortrait
          ? { position: "fixed", inset: 0 }
          : { minHeight: "100dvh" }),
        background: "radial-gradient(ellipse 140% 90% at 50% 15%, #1b6040 0%, #0d3d24 40%, #061810 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes winPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
          50%      { box-shadow: 0 0 40px 8px rgba(74,222,128,0.18); }
        }
        @keyframes losePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { box-shadow: 0 0 40px 8px rgba(239,68,68,0.12); }
        }
        html, body { overflow: hidden !important; overscroll-behavior: none !important; }
      `}</style>

      {/* Drag overlay — fixed, covers whole screen, pointer-events: none */}
      <div
        ref={overlayRef}
        style={{
          display: "none", position: "fixed", top: 0, left: 0,
          zIndex: 1000, pointerEvents: "none",
          transformOrigin: "top left",
        }}
      >
        {dragCards.map((card, i) => (
          <div key={i} style={{
            position: i === 0 ? "relative" : "absolute",
            top: i === 0 ? 0 : i * ovu, left: 0,
          }}>
            <CardFaceSimple card={card} />
          </div>
        ))}
      </div>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        padding: "0 16px", height: 36, flexShrink: 0,
        position: "relative", zIndex: 10,
      }}>
        <span style={{ fontWeight: 900, fontSize: "0.9rem", letterSpacing: "-0.5px", background: "linear-gradient(120deg,#fbbf24,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Z-HUB</span>

        <button onClick={e => { e.stopPropagation(); setConfirmQuit(true); }}
          style={{ color: "#ef4444", fontSize: "0.65rem", padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", display: "inline-flex", alignItems: "center", gap: 4, transition: "border-color 0.15s, background 0.15s", cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Quitter
        </button>
      </header>

      {/* Modal confirmation quitter */}
      {confirmQuit && (
        <div onClick={() => setConfirmQuit(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#061810", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 36px", textAlign: "center", maxWidth: 320 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>Tu veux vraiment quitter ?</p>
            <p style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 24 }}>La partie sera comptée comme une défaite.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmQuit(false)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <button onClick={() => {
                fetch("/api/stats/record", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game: "solitaire", won: false, elapsed: gs.elapsed, moves: gs.moves }) }).catch(() => {});
                try { localStorage.removeItem(`z-solitaire-${gameId}`); localStorage.removeItem("z-solitaire-current"); } catch {}
                router.push("/hub/solitaire");
              }} style={{ padding: "9px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 800, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Quitter</button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-game overlay — victory or defeat */}
      <AnimatePresence>
        {(gs.won || stuck) && (
          <motion.div
            key={gs.won ? "win" : "stuck"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: gs.won ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.08 }}
              style={{
                background: gs.won
                  ? "linear-gradient(145deg, #14532d 0%, #052e16 100%)"
                  : "linear-gradient(145deg, #1c1a2e 0%, #0d0b1a 100%)",
                border: gs.won
                  ? "1px solid rgba(74,222,128,0.2)"
                  : "1px solid rgba(148,103,189,0.2)",
                borderRadius: 32, padding: "56px 80px", textAlign: "center",
                boxShadow: "0 48px 120px rgba(0,0,0,0.75)",
                animation: gs.won ? "winPulse 3s ease-in-out infinite" : "losePulse 3s ease-in-out infinite",
                maxWidth: 420, width: "90vw",
              }}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: gs.won ? -20 : 0 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.18 }}
                style={{ fontSize: "4rem", marginBottom: 20, lineHeight: 1 }}
              >
                {gs.won ? "🃏" : "😔"}
              </motion.div>

              {/* Title */}
              <div style={{
                fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 8,
                color: gs.won ? "#4ade80" : "#a78bfa",
              }}>
                {gs.won ? "Victoire !" : "Partie terminée"}
              </div>

              {/* Subtitle */}
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.85rem", marginBottom: 4 }}>
                {gs.won
                  ? `${gs.moves} coups · ${fmtTime(gs.elapsed)}`
                  : "Plus aucun coup possible"}
              </div>

              {/* Stats row */}
              <div style={{
                display: "flex", gap: 20, justifyContent: "center",
                marginTop: 20, marginBottom: 36,
              }}>
                <div style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: 12,
                  padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 900, color: gs.won ? "#4ade80" : "#a78bfa" }}>
                    {gs.moves}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>coups</span>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: 12,
                  padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 900, color: gs.won ? "#4ade80" : "#a78bfa" }}>
                    {fmtTime(gs.elapsed)}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>temps</span>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: 12,
                  padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 900, color: gs.won ? "#4ade80" : "#a78bfa" }}>
                    {completedCount}
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>/52</span>
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>cartes</span>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {confirmNew ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirmNew(false)}
                      style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>
                      Annuler
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={newGame}
                      style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: gs.won ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", fontWeight: 900, fontSize: "0.9rem", cursor: "pointer", boxShadow: gs.won ? "0 6px 18px rgba(34,197,94,0.4)" : "0 6px 18px rgba(124,58,237,0.4)" }}>
                      Confirmer
                    </motion.button>
                  </div>
                ) : (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setConfirmNew(true)}
                    style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: gs.won ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", fontWeight: 900, fontSize: "1rem", cursor: "pointer", boxShadow: gs.won ? "0 8px 24px rgba(34,197,94,0.4)" : "0 8px 24px rgba(124,58,237,0.4)" }}>
                    {gs.won ? "Rejouer" : "Nouvelle partie"}
                  </motion.button>
                )}
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/hub/solitaire"
                  style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}>
                  Retour au hub
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Game area */}
      <div
        style={{ padding: isMobile && !isPortrait ? "8px 16px 4px" : "16px 28px 8px", display: "flex", flexDirection: "column", gap: isMobile && !isPortrait ? 6 : 12, zoom: gameScale }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top row */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {/* Foundations */}
          <div style={{ display: "flex", gap: 10 }}>
            {gs.foundations.map((pile, p) => {
              const isHover = hoverTarget?.to === "f" && hoverTarget.p === p;
              return (
                <div
                  key={p}
                  ref={el => { foundationRefs.current[p] = el; }}
                  style={{ cursor: "pointer" }}
                >
                  {pile.length === 0
                    ? <EmptySlot label={SYM[p]} onClick={() => clickFoundation(p)} highlight={isHover} />
                    : <div style={{ borderRadius: 9, boxShadow: isHover ? "0 0 0 2.5px rgba(74,222,128,0.55)" : "none", transition: "box-shadow 0.1s" }}>
                        <CardFace card={pile.at(-1)!} selected={false} onClick={() => clickFoundation(p)} />
                      </div>
                  }
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* Stock + Waste */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ position: "relative" }}>
              {gs.stock.length > 0
                ? <CardBack onClick={clickStock} />
                : <EmptySlot label="↺" onClick={clickStock} />
              }
              <AnimatePresence>
                {gs.stock.length > 0 && (
                  <motion.div
                    key={gs.stock.length}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      position: "absolute", top: -7, right: -7, minWidth: 20, height: 20,
                      background: "#22c55e", borderRadius: 10, fontSize: "0.6rem", fontWeight: 900,
                      color: "#052e16", display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px", zIndex: 10, pointerEvents: "none",
                    }}
                  >{gs.stock.length}</motion.div>
                )}
              </AnimatePresence>
            </div>
            <div onClick={e => { e.stopPropagation(); clickWaste(); }}>
              {gs.waste.length === 0
                ? <EmptySlot />
                : <CardFace
                    card={gs.waste.at(-1)!}
                    selected={sel?.from === "waste"}
                    onClick={clickWaste}
                    onDoubleClick={dblClickWaste}
                    onPointerDown={e => startDrag(e, { from: "waste" })}
                    ghost={isCardGhosted("waste", -1, -1)}
                  />
              }
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div key={gs.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {gs.tableau.map((col, c) => {
            const isHover = hoverTarget?.to === "t" && hoverTarget.col === c;
            return (
              <div
                key={c}
                ref={el => { tabRefs.current[c] = el; }}
                onClick={e => { e.stopPropagation(); if (!col.length) clickEmptyCol(c); }}
                style={{
                  position: "relative", width: CW, height: colH(col), minHeight: CH, flexShrink: 0,
                  borderRadius: 9,
                  outline: isHover ? "2px solid rgba(74,222,128,0.45)" : "none",
                  boxShadow: isHover ? "0 0 0 4px rgba(74,222,128,0.1)" : "none",
                  transition: "outline 0.1s, box-shadow 0.1s",
                }}
              >
                {!col.length && <EmptySlot onClick={() => clickEmptyCol(c)} highlight={isHover} />}
                {col.map((card, i) => {
                  const top = col.slice(0, i).reduce((h, c2) => h + (c2.faceUp ? ovu : OVD), 0);
                  const isSelected = sel?.from === "tab" && sel.col === c && i >= sel.idx;
                  const ghost = isCardGhosted("tab", c, i);
                  return (
                    <div
                      key={`${card.suit}-${card.rank}`}
                      style={{ position: "absolute", top, left: 0, zIndex: i + (isSelected ? 60 : 0) }}
                    >
                      <CardFlip
                        card={card}
                        isSelected={isSelected}
                        onClick={() => clickTabCard(c, i)}
                        onDoubleClick={() => dblClickTabCard(c, i)}
                        onPointerDown={card.faceUp ? e => startDrag(e, { from: "tab", col: c, idx: i }) : undefined}
                        delay={dealDelay(c, i)}
                        ghost={ghost}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom encart */}
      <div style={{ padding: "10px 0 14px", display: "flex", justifyContent: "center", zoom: gameScale, background: "rgba(6,24,16,0.85)", backdropFilter: "blur(12px)", flexShrink: 0, marginTop: "auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 0, background: "rgba(10,30,18,0.85)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 999, backdropFilter: "blur(12px)", overflow: "hidden" }}>
          {/* Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>{fmtTime(gs.elapsed)}</span>
          </div>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          {/* Moves */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "rgba(255,255,255,0.55)" }}>{gs.moves} coups</span>
          </div>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px" }}>
            <div style={{ width: 90, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
              <motion.div animate={{ width: `${progressPct}%` }} transition={{ type: "spring", stiffness: 200, damping: 24 }}
                style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "rgba(74,222,128,0.6)" }}>{completedCount}<span style={{ color: "rgba(255,255,255,0.2)" }}>/52</span></span>
          </div>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          {/* Hint */}
          <button onClick={e => { e.stopPropagation(); showHint(); }} disabled={hinting || gs.won || stuck}
            style={{ padding: "10px 22px", cursor: hinting ? "default" : "pointer", border: "none", background: hinting ? "rgba(250,204,21,0.1)" : "transparent", color: hinting ? "#fde68a" : "rgba(255,255,255,0.35)", fontSize: "0.9rem", fontWeight: 800, transition: "all 0.2s", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7 }}
            onMouseEnter={e => { if (!hinting && !gs.won && !stuck) { e.currentTarget.style.background = "rgba(250,204,21,0.08)"; e.currentTarget.style.color = "#fde68a"; } }}
            onMouseLeave={e => { if (!hinting) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; } }}
          >💡 <span>Indice</span></button>
        </div>
      </div>
    </main>
  );
}
