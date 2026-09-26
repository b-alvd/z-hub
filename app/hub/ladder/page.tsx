"use client";
import { useEffect, useState } from "react";

const GAME_LABELS: Record<string, string> = { zuno: "ZUNO Multi", "zuno-solo": "ZUNO Solo", solitaire: "Solitaire" };
const GAME_COLORS: Record<string, [string, string]> = {
  zuno: ["#f59e0b", "#ef4444"],
  "zuno-solo": ["#f59e0b", "#ef4444"],
  solitaire: ["#22c55e", "#16a34a"],
};
const GAME_CATEGORY: Record<string, "multi" | "solo"> = {
  zuno: "multi",
  "zuno-solo": "solo",
  solitaire: "solo",
};
const SOLO_GAMES = new Set(["solitaire", "zuno-solo"]);

type Entry = { userId: string; username: string; played: number; wins: number; winRate: number; bestTime: number | null; avgTime: number | null; avgMoves: number | null };
type Data = { global: Entry[]; byGame: Record<string, Entry[]> };

function fmtTime(s: number) { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, "0")}`; }

const PODIUM_ORDER = [1, 0, 2] as const;
const PODIUM_H = [72, 96, 56];
const MEDAL_COLOR = ["#f59e0b", "#94a3b8", "#b45309"];

function Medal({ rank, size = 22 }: { rank: number; size?: number }) {
  const c = MEDAL_COLOR[rank];
  const isFirst = rank === 0;
  // Circle center is at 33% from top of the SVG viewBox (cy=8 out of 24)
  const circleCenterTop = size * (8 / 24);
  const circleRadius = size * (6 / 24);
  return (
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
        style={isFirst ? { animation: "medalGlow 2s ease-in-out infinite" } : undefined}>
        {isFirst && <circle cx="12" cy="8" r="7.5" fill={`${c}12`} />}
        <circle cx="12" cy="8" r="6" stroke={c} strokeWidth="1.6" fill={`${c}18`} />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={c} strokeWidth="1.6" />
      </svg>
      {/* Number overlaid on the circle, centered via absolute positioning */}
      <span style={{
        position: "absolute",
        left: 0, width: size,
        top: circleCenterTop - circleRadius,
        height: circleRadius * 2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: circleRadius * 1.1, fontWeight: 900, color: c,
        fontFamily: "system-ui, sans-serif", lineHeight: 1, userSelect: "none",
      }}>{rank + 1}</span>
    </span>
  );
}

function WinRateBadge({ value }: { value: number }) {
  const good = value >= 50;
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 6,
      fontSize: "0.72rem", fontWeight: 800, fontVariantNumeric: "tabular-nums",
      background: good ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
      color: good ? "#22c55e" : "#475569",
      border: `1px solid ${good ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`,
    }}>{value}%</span>
  );
}

function Podium({ entries, color, me, isSolo = false }: { entries: Entry[]; color: [string, string]; me: string; isSolo?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0, padding: "28px 0 0", marginBottom: 0, position: "relative", overflow: "hidden" }}>
      {PODIUM_ORDER.map((rank, pos) => {
        const e = entries[rank] ?? null;
        const isMe = e?.username === me;
        const isFirst = rank === 0;
        return (
          <div key={rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, maxWidth: 160, position: "relative" }}>
            <span style={{
              position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
              width: "100%", height: "calc(100% + 80px)",
              background: `linear-gradient(to bottom, ${MEDAL_COLOR[rank]}20 0%, ${MEDAL_COLOR[rank]}00 100%)`,
              clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
              filter: "url(#spotlight-noise)",
              animation: `spotOn 1.2s ease-out both`,
              animationDelay: `${rank * 0.4}s`,
              pointerEvents: "none",
            }} />
            {/* Avatar */}
            <div style={{
              width: isFirst ? 52 : 40, height: isFirst ? 52 : 40, borderRadius: "50%",
              background: e ? (isMe ? "rgba(16,185,129,0.2)" : isFirst ? `${color[0]}22` : "rgba(255,255,255,0.06)") : "rgba(255,255,255,0.03)",
              border: `2px solid ${e ? (isMe ? "#10b981" : isFirst ? color[0] : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.07)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isFirst ? "1.1rem" : "0.85rem", fontWeight: 900,
              color: e ? (isMe ? "#10b981" : isFirst ? color[0] : "#64748b") : "#1e293b",
              flexShrink: 0,
            }}>{e ? e.username[0]?.toUpperCase() : "?"}</div>
            {/* Name */}
            <div style={{ textAlign: "center", padding: "0 4px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: e ? (isMe ? "#10b981" : isFirst ? "#e2e8f0" : "#64748b") : "#1e293b", lineHeight: 1.2 }}>{e ? e.username : "—"}</div>
              <div style={{ fontSize: "0.6rem", color: e ? (isFirst ? color[0] : "#374151") : "#1e293b", fontWeight: 700, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                {e ? (isSolo
                  ? `${e.wins}V · ${e.winRate}%${e.bestTime ? ` · ⏱${fmtTime(e.bestTime)}` : ""}`
                  : `${e.wins}V · ${e.winRate}%`) : ""}
              </div>
            </div>
            {/* Block */}
            <div style={{
              width: "100%", height: PODIUM_H[pos],
              background: isFirst
                ? `linear-gradient(180deg, ${color[0]}22, ${color[0]}0a)`
                : rank === 1 ? "rgba(148,163,184,0.06)" : "rgba(161,98,7,0.06)",
              borderTop: `2px solid ${isFirst ? color[0] + "66" : rank === 1 ? "rgba(148,163,184,0.2)" : "rgba(161,98,7,0.2)"}`,
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Medal rank={rank} size={isFirst ? 30 : 24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ entries, me, color, isSolo = false }: { entries: Entry[]; me: string; color: [string, string]; isSolo?: boolean }) {
  if (!entries.length) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#374151", fontSize: "0.82rem" }}>
        Aucune partie enregistrée pour le moment.
      </div>
    );
  }
  const headers = [
    { label: "#", align: "center" as const },
    { label: "Joueur", align: "left" as const },
    { label: "Victoires", align: "right" as const },
    { label: "Défaites", align: "right" as const },
    { label: "Parties", align: "right" as const },
    { label: "Taux", align: "right" as const },
    { label: "Meilleur tps", align: "right" as const },
    { label: "Tps moyen", align: "right" as const },
    ...(isSolo ? [{ label: "Moy. coups", align: "right" as const }] : []),
  ];
  return (
    <div className="ladder-scroll" style={{ maxHeight: 320, overflowY: "auto", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "rgba(6,14,10,0.98)" }}>
          <tr>
            {headers.map(h => (
              <th key={h.label} style={{
                padding: "10px 14px",
                fontSize: "0.58rem", fontWeight: 800, color: "#1e293b",
                letterSpacing: "0.16em", textTransform: "uppercase",
                textAlign: h.align,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const rank = i;
            const isMe = e.username === me;
            const losses = e.played - e.wins;
            const isTop3 = rank < 3;
            return (
              <tr key={e.userId} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: isMe ? "rgba(16,185,129,0.04)" : "transparent", transition: "background 0.1s" }}
                onMouseEnter={e2 => { if (!isMe) (e2.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLTableRowElement).style.background = isMe ? "rgba(16,185,129,0.04)" : "transparent"; }}
              >
                {/* Rank */}
                <td style={{ padding: "10px 14px", textAlign: "center", width: 44 }}>
                  {isTop3
                    ? <Medal rank={rank} size={18} />
                    : <span style={{ color: "#374151", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: "0.72rem" }}>{rank + 1}</span>
                  }
                </td>
                {/* Player */}
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, background: isMe ? "rgba(16,185,129,0.12)" : isTop3 ? `${MEDAL_COLOR[rank]}15` : "rgba(255,255,255,0.04)", color: isMe ? "#10b981" : isTop3 ? MEDAL_COLOR[rank] : "#475569", border: `1.5px solid ${isMe ? "rgba(16,185,129,0.3)" : isTop3 ? `${MEDAL_COLOR[rank]}40` : "rgba(255,255,255,0.07)"}` }}>{e.username[0]?.toUpperCase()}</div>
                    <span style={{ fontWeight: isMe || isTop3 ? 800 : 500, color: isMe ? "#10b981" : isTop3 ? "#e2e8f0" : "#64748b" }}>
                      {e.username}
                      {isMe && <span style={{ fontSize: "0.58rem", color: "#10b981", marginLeft: 5, opacity: 0.7 }}>vous</span>}
                    </span>
                  </div>
                </td>
                {/* Wins */}
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: isTop3 ? color[0] : "#94a3b8" }}>{e.wins}</td>
                {/* Losses */}
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: losses > e.wins ? "rgba(239,68,68,0.5)" : "#374151" }}>{losses}</td>
                {/* Played */}
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#374151", fontVariantNumeric: "tabular-nums" }}>{e.played}</td>
                {/* Win rate */}
                <td style={{ padding: "10px 14px", textAlign: "right" }}><WinRateBadge value={e.winRate} /></td>
                {/* Best time */}
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: e.bestTime ? "#4ade80" : "#374151", fontWeight: e.bestTime ? 800 : 400, fontSize: "0.78rem" }}>{e.bestTime ? fmtTime(e.bestTime) : "—"}</td>
                {/* Avg time */}
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: e.avgTime ? "#94a3b8" : "#374151", fontSize: "0.78rem" }}>{e.avgTime ? fmtTime(e.avgTime) : "—"}</td>
                {/* Avg moves — solo only */}
                {isSolo && <td style={{ padding: "10px 14px", textAlign: "right", color: e.avgMoves ? "#94a3b8" : "#374151", fontVariantNumeric: "tabular-nums" }}>{e.avgMoves ?? "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function LadderPage() {
  const [data, setData] = useState<Data | null>(null);
  const [me, setMe] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | "multi" | "solo">("all");
  const [tab, setTab] = useState<"global" | string>("global");

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => { if (d?.username) setMe(d.username); }).catch(() => {});
    fetch("/api/ladder").then(r => r.json()).then(setData).catch(() => {
      const n = (bt: number|null=null, at: number|null=null, am: number|null=null) => ({ bestTime: bt, avgTime: at, avgMoves: am });
      const mock = [
        { userId: "1",  username: "Test1",  played: 42, wins: 31, winRate: 74, ...n() },
        { userId: "2",  username: "Test2",  played: 38, wins: 22, winRate: 58, ...n() },
        { userId: "3",  username: "Test3",  played: 27, wins: 14, winRate: 52, ...n() },
        { userId: "4",  username: "Test4",  played: 19, wins:  8, winRate: 42, ...n() },
        { userId: "5",  username: "Test5",  played: 15, wins:  5, winRate: 33, ...n() },
        { userId: "6",  username: "Test6",  played: 11, wins:  3, winRate: 27, ...n() },
      ];
      const mockZuno = [
        { userId: "3",  username: "Test3",  played: 20, wins: 16, winRate: 80, ...n() },
        { userId: "1",  username: "Test1",  played: 18, wins: 12, winRate: 67, ...n() },
        { userId: "7",  username: "Test7",  played: 15, wins:  9, winRate: 60, ...n() },
      ];
      const mockSol = [
        { userId: "1",  username: "Test1",  played: 12, wins:  8, winRate: 67, ...n(312, 480, 95) },
        { userId: "2",  username: "Test2",  played:  9, wins:  5, winRate: 56, ...n(445, 610, 110) },
        { userId: "3",  username: "Test3",  played:  6, wins:  2, winRate: 33, ...n(590, 720, 130) },
      ];
      setData({ global: mock, byGame: { zuno: mockZuno, solitaire: mockSol } });
    });
  }, []);

  const allGames = data ? Object.keys(data.byGame) : [];
  // "Tous" shows each game tab individually — no mixed global (multi vs solo incompatible)
  const filteredGames = catFilter === "all" ? allGames : allGames.filter(g => (GAME_CATEGORY[g] ?? "multi") === catFilter);
  // Global tab only shown when a specific category is selected
  const showGlobal = catFilter !== "all" && filteredGames.length > 1;
  const tabs = showGlobal ? ["global", ...filteredGames] : filteredGames;

  const activeTab = tabs.includes(tab) ? tab : (tabs[0] ?? "global");

  // Global = aggregate of games in the current category filter
  const filteredGlobal: Entry[] = (() => {
    if (!data) return [];
    const map: Record<string, { userId: string; username: string; played: number; wins: number }> = {};
    for (const g of filteredGames) {
      for (const e of data.byGame[g] ?? []) {
        if (!map[e.userId]) map[e.userId] = { userId: e.userId, username: e.username, played: 0, wins: 0 };
        map[e.userId].played += e.played;
        map[e.userId].wins += e.wins;
      }
    }
    return Object.values(map)
      .map(e => ({ ...e, winRate: e.played > 0 ? Math.round((e.wins / e.played) * 100) : 0, bestTime: null, avgTime: null, avgMoves: null }))
      .sort((a, b) => b.wins - a.wins || a.played - b.played);
  })();

  const entries: Entry[] = data
    ? (activeTab === "global" ? filteredGlobal : (data.byGame[activeTab] ?? []))
    : [];
  const color: [string, string] = activeTab === "global" ? ["#6366f1", "#8b5cf6"] : (GAME_COLORS[activeTab] ?? ["#6366f1", "#8b5cf6"]);

  return (
    <div style={{ minHeight: "100dvh", background: "radial-gradient(ellipse 80% 50% at 50% 0%, #0c1a12 0%, #030b07 60%)", color: "#e2e8f0" }}>
      <style>{`
        @keyframes medalGlow { 0%,100%{filter:drop-shadow(0 0 3px #f59e0b66)} 50%{filter:drop-shadow(0 0 10px #f59e0bcc) drop-shadow(0 0 20px #f59e0b55)} }
        .ladder-scroll::-webkit-scrollbar { width: 2px; height: 2px; }
        .ladder-scroll::-webkit-scrollbar-track { background: transparent; }
        .ladder-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .ladder-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes spotOn {
          0%   { opacity: 0   }
          20%  { opacity: .12 }
          35%  { opacity: .25 }
          42%  { opacity: .18 }
          55%  { opacity: .45 }
          62%  { opacity: .38 }
          75%  { opacity: .7  }
          80%  { opacity: .6  }
          90%  { opacity: .9  }
          95%  { opacity: .8  }
          100% { opacity: 1   }
        }
        @keyframes flicker {
          0%   { opacity: 1    }
          8%   { opacity: .85  }
          9%   { opacity: 1    }
          18%  { opacity: .92  }
          20%  { opacity: 1    }
          40%  { opacity: .78  }
          41%  { opacity: 1    }
          55%  { opacity: .95  }
          57%  { opacity: .7   }
          58%  { opacity: 1    }
          75%  { opacity: .88  }
          77%  { opacity: 1    }
          90%  { opacity: .82  }
          92%  { opacity: 1    }
          100% { opacity: 1    }
        }
      `}</style>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="spotlight-noise" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>

      {/* Topbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(3,11,7,0.85)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <a href="/hub" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#475569", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", padding: "5px 11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", transition: "color 0.15s, border-color 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.color="#94a3b8"; e.currentTarget.style.borderColor="rgba(255,255,255,0.14)"; }}
          onMouseLeave={e => { e.currentTarget.style.color="#475569"; e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Hub
        </a>
        <span style={{ fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.5px", background: "linear-gradient(120deg,#fbbf24,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Z-HUB</span>
        <div style={{ width: 72 }} />
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px 64px" }}>

        {/* Title */}
        <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "#374151" }}>Classement</span>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, margin: 0, background: "linear-gradient(135deg,#e2e8f0 30%,#64748b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ladder</h1>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {([["all", "Tous"], ["multi", "Multijoueur"], ["solo", "Solo"]] as const).map(([val, label]) => {
            const active = catFilter === val;
            return (
              <button key={val} onClick={() => { setCatFilter(val); setTab("global"); }} style={{
                padding: "4px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 700, fontSize: "0.7rem",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: active ? "#e2e8f0" : "#374151",
                boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.12)" : "none",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#64748b"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#374151"; }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {tabs.map(t => {
            const active = activeTab === t;
            const c = t === "global" ? "#6366f1" : (GAME_COLORS[t]?.[0] ?? "#6366f1");
            return (
              <button key={t} onClick={() => { setTab(t); }} style={{
                padding: "7px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 800, fontSize: "0.78rem",
                background: active ? `${c}20` : "rgba(255,255,255,0.03)",
                color: active ? c : "#374151",
                boxShadow: active ? `inset 0 0 0 1.5px ${c}50` : "inset 0 0 0 1px rgba(255,255,255,0.07)",
                transition: "all 0.18s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#374151"; }}>
                {t === "global"
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Global</>
                  : (GAME_LABELS[t] ?? t.toUpperCase())}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={{ background: "rgba(6,14,10,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {!data
            ? <div style={{ padding: "60px 0", textAlign: "center", color: "#374151", fontSize: "0.85rem" }}>Chargement…</div>
            : <>
                <Podium entries={entries} color={color} me={me} isSolo={activeTab !== "global" && SOLO_GAMES.has(activeTab)} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "20px 0 0" }} />
                <Table entries={entries} me={me} color={color} isSolo={activeTab !== "global" && SOLO_GAMES.has(activeTab)} />
              </>
          }
        </div>

        <p style={{ marginTop: 20, fontSize: "0.62rem", color: "#1e293b", textAlign: "center" }}>
          Parties terminées uniquement · Les données sont mises à jour en temps réel
        </p>
      </div>
    </div>
  );
}
