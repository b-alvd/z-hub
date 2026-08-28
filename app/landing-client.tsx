"use client";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/actions";

function IconPlay() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><polygon points="5,3 19,12 5,21"/></svg>;
}

function IconCards() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="13" height="17" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-2"/></svg>;
}

function IconLock() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

const DISCORD_SVG = (size: number) => (
  <svg width={size} height={size} viewBox="-1 0 16 15" fill="currentColor" overflow="visible" style={{ display: "block", flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.384 8.384 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
  </svg>
);

type Props = { user: { username: string } | null };

export default function LandingClient({ user }: Props) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
    {/* Modale connexion */}
    {showLogin && (
      <div onClick={() => setShowLogin(false)} style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, padding: "40px 36px", maxWidth: 360, width: "90%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.3px", marginBottom: 8 }}>Connectez-vous pour jouer</div>
            <div style={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.6 }}>Un compte est nécessaire pour accéder aux jeux. C'est gratuit et rapide.</div>
          </div>
          <a href="/api/auth/discord"
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#4752c4"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#5865F2"; }}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 11, textDecoration: "none",
              background: "#5865F2", color: "#fff", fontWeight: 800, fontSize: "0.9rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 0.15s",
            }}>
            {DISCORD_SVG(18)}
            Se connecter avec Discord
          </a>
        </div>
      </div>
    )}
    <style>{`
      @keyframes scroll-bounce { 0%,100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(6px); opacity: 1; } }
      .scroll-hint { animation: scroll-bounce 1.8s ease-in-out infinite; }
      @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
      @keyframes pulse-green { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
      .hero-visual { animation: float 5s ease-in-out infinite; }
      .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; animation: pulse-green 1.8s ease-in-out infinite; }
      .lnd-btn, .lnd-ghost, .lnd-nav, .lnd-profile { outline: none !important; }
      .lnd-btn:focus-visible, .lnd-ghost:focus-visible, .lnd-nav:focus-visible, .lnd-profile:focus-visible { outline: 2px solid rgba(245,158,11,0.5) !important; outline-offset: 3px; }
      .lnd-nav { transition: color 0.15s; }
      .lnd-nav:hover { color: #94a3b8 !important; }
      .lnd-profile { transition: border-color 0.15s, background 0.15s; }
      .lnd-profile:hover { border-color: rgba(255,255,255,0.15) !important; background: rgba(255,255,255,0.04) !important; }
      .game-card-zuno { transition: transform 0.2s, border-color 0.2s; }
      .game-card-zuno:hover { transform: translateY(-4px); border-color: rgba(245,158,11,0.35) !important; }
    `}</style>
    <main style={{
      background: "#030b07", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
    }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 58,
        background: "rgba(3,11,7,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <Link href="/" style={{
          fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-1.5px", paddingRight: 4,
          background: "linear-gradient(120deg,#fbbf24,#ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textDecoration: "none",
        }}>Z-HUB</Link>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <Link href="/profile" className="lnd-profile" style={{
                padding: "7px 14px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 700,
                color: "#ffffff", textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#ef4444)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 900, color: "#0a0a0a", flexShrink: 0,
                }}>{user.username[0].toUpperCase()}</span>
                {user.username}
              </Link>
              <Link href="/hub" className="lnd-btn" style={{
                padding: "7px 18px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 800,
                color: "#0a0a0a", textDecoration: "none",
                background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                display: "flex", alignItems: "center", gap: 6,
              }}><IconPlay /> Jouer</Link>
            </>
          ) : (
            <a href="/api/auth/discord" className="lnd-btn" style={{
              padding: "6px 14px", borderRadius: 9, fontSize: "0.78rem", fontWeight: 800,
              color: "#fff", textDecoration: "none", background: "#5865F2",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              {DISCORD_SVG(15)}
              Se connecter
            </a>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 64px", position: "relative",
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.016) 40px),
                          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.016) 40px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 80, maxWidth: 1000, width: "100%" }}>
          {/* Texte */}
          <div style={{ flex: "1 1 0" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 24 }}>Mini-jeux en ligne</p>
            <h1 style={{
              fontSize: "clamp(4rem,9vw,8rem)", fontWeight: 900,
              letterSpacing: "-6px", lineHeight: 0.88, margin: "0 0 32px",
              background: "linear-gradient(130deg,#fbbf24 0%,#f97316 45%,#ef4444 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Z-HUB</h1>
            <p style={{ fontSize: "1rem", color: "#94a3b8", maxWidth: 340, lineHeight: 1.7, margin: "0 0 40px" }}>
              Joue, bats les scores, deviens la légende.
            </p>
          </div>

          {/* Carte ZUNO */}
          <div className="hero-visual" style={{ flex: "0 0 320px" }}>
            <div style={{
              padding: "32px 28px", borderRadius: 24,
              background: "linear-gradient(145deg, rgba(245,158,11,0.09) 0%, rgba(239,68,68,0.05) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
              backdropFilter: "blur(24px)", marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <IconCards />
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 20 }}>
                  <span className="pulse-dot" />
                  <span style={{ fontSize: "0.63rem", fontWeight: 800, color: "#10b981", letterSpacing: "0.08em" }}>EN LIGNE</span>
                </div>
              </div>
              <div style={{ fontSize: "1.7rem", fontWeight: 900, color: "#f59e0b", letterSpacing: "-1px", marginBottom: 6 }}>ZUNO</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>Jusqu'à 8 joueurs · Solo avec adversaires IA</div>
              {user ? (
                <Link href="/hub/zuno" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "10px 0", borderRadius: 10, textDecoration: "none",
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)",
                  fontSize: "0.82rem", fontWeight: 800, color: "#f59e0b",
                }}><IconPlay /> Jouer</Link>
              ) : (
                <button onClick={() => setShowLogin(true)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "10px 0", borderRadius: 10, width: "100%", cursor: "pointer", fontFamily: "inherit",
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)",
                  fontSize: "0.82rem", fontWeight: 800, color: "#f59e0b",
                }}><IconPlay /> Jouer</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[0,1].map(i => (
                <div key={i} style={{
                  flex: 1, padding: "14px", borderRadius: 14,
                  background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.35,
                }}>
                  <IconLock />
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>Bientôt</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1f2937" }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* CITATION */}
      <section style={{
        padding: "80px 48px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.01)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "clamp(1.4rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-1px", color: "#e2e8f0", margin: 0 }}>
          Gratuit, sans pub, sans captcha à la con. Juste des jeux.
        </p>
      </section>

      {/* GAMES GRID */}
      <section style={{ padding: "100px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#374151", marginBottom: 12 }}>Catalogue</p>
        <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 900, letterSpacing: "-1.5px", color: "#e2e8f0", margin: "0 0 48px" }}>Les jeux disponibles</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {/* ZUNO */}
          <div className="game-card-zuno" style={{
            padding: "32px 28px", borderRadius: 22,
            background: "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(239,68,68,0.04))",
            border: "1px solid rgba(245,158,11,0.15)",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <IconCards />
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.08)", padding: "3px 9px", borderRadius: 20 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#10b981", letterSpacing: "0.08em" }}>EN LIGNE</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#f59e0b", letterSpacing: "-0.5px", marginBottom: 6 }}>ZUNO</div>
              <div style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.6 }}>Jusqu'à 8 joueurs · Solo avec adversaires IA</div>
            </div>
            {user ? (
              <Link href="/hub/zuno" style={{
                padding: "9px 0", borderRadius: 10, textDecoration: "none",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                fontSize: "0.8rem", fontWeight: 800, color: "#f59e0b",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}><IconPlay /> Jouer</Link>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{
                padding: "9px 0", borderRadius: 10, width: "100%", cursor: "pointer", fontFamily: "inherit",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                fontSize: "0.8rem", fontWeight: 800, color: "#f59e0b",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}><IconPlay /> Jouer</button>
            )}
          </div>
          {/* Bientôt x2 */}
          {[0, 1].map((i) => (
            <div key={i} style={{
              padding: "32px 28px", borderRadius: 22,
              background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
              display: "flex", flexDirection: "column", gap: 20, opacity: 0.3,
            }}>
              <IconLock />
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#374151", letterSpacing: "-0.5px", marginBottom: 6 }}>Bientôt</div>
                <div style={{ fontSize: "0.78rem", color: "#1f2937" }}>Un nouveau jeu arrive</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "120px 48px", borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <h2 style={{ fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 900, letterSpacing: "-4px", lineHeight: 0.95, color: "#e2e8f0", margin: "0 0 40px", textAlign: "center" }}>Tu attends quoi ?</h2>
        {user ? (
          <Link href="/hub" className="lnd-btn" style={{
            padding: "16px 44px", borderRadius: 12, fontSize: "1.1rem", fontWeight: 800,
            color: "#0a0a0a", textDecoration: "none",
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}><IconPlay /> Aller au hub</Link>
        ) : (
          <button onClick={() => setShowLogin(true)} className="lnd-btn" style={{
            padding: "16px 44px", borderRadius: 12, fontSize: "1.1rem", fontWeight: 800,
            color: "#0a0a0a", cursor: "pointer", fontFamily: "inherit", border: "none",
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}><IconPlay /> Jouer</button>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "28px 48px", borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontWeight: 900, fontSize: "0.9rem", letterSpacing: "-1px",
          background: "linear-gradient(120deg,#fbbf24,#ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Z-HUB</span>

        <span style={{ fontSize: "0.72rem", color: "#475569" }}>Développé par b_alvd · © 2026 Z-HUB</span>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {user ? (
            <>
              <Link href="/profile" className="lnd-nav" style={{ fontSize: "0.78rem", color: "#475569", textDecoration: "none" }}>Profil</Link>
              <button onClick={() => logout()} className="lnd-nav" style={{ fontSize: "0.78rem", color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Déconnexion</button>
            </>
          ) : (
            <a href="/api/auth/discord" className="lnd-nav" style={{ fontSize: "0.78rem", color: "#475569", textDecoration: "none" }}>Se connecter</a>
          )}
        </div>
      </footer>
    </main>
    </>
  );
}
