"use client";
import Link from "next/link";
import { logout, deleteAccount } from "@/lib/actions";
import { useState } from "react";

function IconPlay() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>;
}

type Props = { username: string; email: string; isDiscord: boolean };

export default function ProfileClient({ username, email, isDiscord }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <main style={{
      minHeight: "100dvh", background: "#030b07", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 58,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(3,11,7,0.9)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{
          fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-1.5px", paddingRight: 4,
          background: "linear-gradient(120deg,#fbbf24,#ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textDecoration: "none",
        }}>Z-HUB</Link>
        <Link href="/hub"
          className="lnd-btn"
          style={{
            padding: "7px 18px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 800,
            color: "#0a0a0a", textDecoration: "none",
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            display: "flex", alignItems: "center", gap: 6,
          }}><IconPlay /> Jouer</Link>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 40px" }}>

        {/* Avatar + nom */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#fbbf24,#ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", fontWeight: 900, color: "#0a0a0a",
          }}>{username[0].toUpperCase()}</div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-1px", color: "#e2e8f0" }}>
              {username}
            </div>
            {isDiscord && (
              <div style={{ fontSize: "0.75rem", color: "#5865F2", marginTop: 4, fontWeight: 600 }}>
                Connecté via Discord
              </div>
            )}
          </div>
        </div>

        {/* Infos */}
        <section style={{ marginBottom: 48 }}>
          {[
            { label: "Pseudo", value: username },
            { label: isDiscord ? "Email (fourni par Discord)" : "Email", value: email },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{row.value}</span>
            </div>
          ))}
        </section>

        {/* Compte */}
        <section>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1f2937", marginBottom: 16 }}>
            Compte
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <form action={logout}>
              <button type="submit"
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.07)"; el.style.color = "#94a3b8"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.03)"; el.style.color = "#64748b"; }}
                style={{
                  padding: "10px 22px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700,
                  color: "#64748b", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", transition: "background 0.15s, color 0.15s",
                }}>Se déconnecter</button>
            </form>
            {!confirming ? (
              <button onClick={() => setConfirming(true)}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(239,68,68,0.1)"; el.style.borderColor = "rgba(239,68,68,0.25)"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(239,68,68,0.04)"; el.style.borderColor = "rgba(239,68,68,0.1)"; }}
                style={{
                  padding: "10px 22px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700,
                  color: "#ef4444", background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.1)", cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                }}>Supprimer mon compte</button>
            ) : null}
          </div>

          {confirming && (
            <div style={{
              marginTop: 16, padding: "18px 20px", borderRadius: 12,
              background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                Toutes tes données seront supprimées. C'est irréversible.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <form action={deleteAccount}>
                  <button type="submit" style={{
                    padding: "8px 18px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 800,
                    color: "#fff", background: "#ef4444", border: "none", cursor: "pointer",
                  }}>Oui, supprimer</button>
                </form>
                <button onClick={() => setConfirming(false)} style={{
                  padding: "8px 18px", borderRadius: 9, fontSize: "0.82rem", fontWeight: 700,
                  color: "#374151", background: "none",
                  border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
                }}>Annuler</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
