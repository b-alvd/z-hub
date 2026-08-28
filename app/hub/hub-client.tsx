"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions";
import Link from "next/link";

function IconPlay() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>;
}
function IconUser() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function IconLogout() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

function IconCards() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="13" height="17" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-2"/></svg>;
}
function IconLock() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

const GAMES = [
  {
    id: "zuno",
    name: "ZUNO",
    description: "UNO mais ZUNO, jusqu'à 8 joueurs",
    icon: <IconCards />,
    color: "#f59e0b",
    href: "/hub/zuno",
    available: true,
  },
  {
    id: "soon1",
    name: "Bientôt",
    description: "Un nouveau jeu arrive",
    icon: <IconLock />,
    color: "#374151",
    href: "#",
    available: false,
  },
  {
    id: "soon2",
    name: "Bientôt",
    description: "Un nouveau jeu arrive",
    icon: <IconLock />,
    color: "#374151",
    href: "#",
    available: false,
  },
];

export default function HubClient({ username }: { username: string }) {
  const initial = username[0]?.toUpperCase() ?? "?";
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const router = useRouter();

  async function joinGame() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setJoinError("Code invalide"); return; }
    setJoining(true); setJoinError("");
    const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
    const data = await res.json();
    if (res.ok) { router.push(`/hub/zuno/lobby/${code}`); }
    else { setJoinError(data.error || "Erreur"); setJoining(false); }
  }

  return (
    <main style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse 90% 70% at 50% 35%, #0c2418 0%, #050e0a 55%, #020608 100%)",
      display: "flex", flexDirection: "column",
    }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/" style={{
          fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-1.5px", paddingRight: 4,
          background: "linear-gradient(135deg,#fbbf24,#ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textDecoration: "none",
        }}>Z-HUB</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/profile" className="lnd-profile" style={{
            padding: "6px 14px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 700,
            color: "#94a3b8", textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "linear-gradient(135deg,#fbbf24,#ef4444)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.6rem", fontWeight: 900, color: "#0a0a0a", flexShrink: 0,
            }}>{initial}</span>
            {username}
          </Link>
          <form action={logout}>
            <button type="submit" title="Se déconnecter" className="lnd-profile" style={{
              width: 34, height: 34, borderRadius: 8,
              background: "none", border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer", color: "#475569",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><IconLogout /></button>
          </form>
        </div>
      </header>

      <section style={{ padding: "60px 32px 40px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 900,
          letterSpacing: "-3px", lineHeight: 1.05, margin: "0 0 16px",
          color: "#fbbf24",
        }}>Le hub des jeux</h1>
        <p style={{ color: "#4b5563", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Choisis ton jeu
        </p>
      </section>

      <section style={{
        display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
        padding: "0 32px 60px", maxWidth: 900, margin: "0 auto", width: "100%",
      }}>
        {GAMES.map((game) => (
          <div key={game.id} style={{
              width: 240, padding: "32px 28px", borderRadius: 24,
              background: "rgba(255,255,255,0.03)",
              border: `1.5px solid ${game.available ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
              backdropFilter: "blur(12px)",
              opacity: game.available ? 1 : 0.4,
              transition: "all 0.25s cubic-bezier(.34,1.56,.64,1)",
              display: "flex", flexDirection: "column", gap: 12,
            }}
              onMouseEnter={(e) => {
                if (!game.available) return;
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-6px) scale(1.02)";
                el.style.borderColor = game.color + "55";
                el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${game.color}33`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "";
                el.style.borderColor = game.available ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)";
                el.style.boxShadow = "";
              }}
            >
              <div style={{ color: game.color, opacity: game.available ? 1 : 0.5 }}>{game.icon}</div>
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: game.color, letterSpacing: "-0.5px" }}>
                  {game.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#4b5563", marginTop: 4, lineHeight: 1.4 }}>
                  {game.description}
                </div>
              </div>
              {game.available && (
                <div
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${game.color}30`; el.style.borderColor = `${game.color}66`; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${game.color}18`; el.style.borderColor = `${game.color}33`; }}
                  style={{
                    marginTop: 8, borderRadius: 10,
                    background: `${game.color}18`, border: `1px solid ${game.color}33`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}>
                  <Link href={game.href} style={{
                    padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontSize: "0.78rem", fontWeight: 800, color: game.color,
                    textDecoration: "none",
                  }}>
                    <IconPlay /> Jouer
                  </Link>
                </div>
              )}
            </div>
        ))}
      </section>

      {/* Rejoindre une partie */}
      <section style={{ padding: "0 32px 60px", display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "24px 32px", maxWidth: 400, width: "100%",
        }}>
          <div style={{ fontSize: "0.7rem", color: "#374151", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
            Rejoindre une partie
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(""); }}
              onKeyDown={e => e.key === "Enter" && joinGame()}
              placeholder="CODE"
              maxLength={6}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontFamily: "monospace",
                fontSize: "1rem", fontWeight: 700, letterSpacing: "0.2em", outline: "none",
              }}
            />
            <button onClick={joinGame} disabled={joining} style={{
              padding: "10px 18px", borderRadius: 10,
              background: joining ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.12)",
              color: "#f59e0b", fontWeight: 800, fontSize: "0.85rem", cursor: joining ? "default" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              border: "1px solid rgba(245,158,11,0.22)",
              transition: "background 0.15s, border-color 0.15s, transform 0.12s",
            }}
              onMouseEnter={e => { if (!joining) { e.currentTarget.style.background = "rgba(245,158,11,0.22)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.45)"; e.currentTarget.style.transform = "scale(1.03)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.22)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              {joining ? "…" : <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Rejoindre
              </>}
            </button>
          </div>
          {joinError && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: 8, fontWeight: 600 }}>{joinError}</p>}
        </div>
      </section>
    </main>
  );
}
