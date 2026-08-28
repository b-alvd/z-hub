"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#080a06",
      fontFamily: "inherit", padding: 24,
    }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

        {/* Icône */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: 4,
          background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="11"/>
            <line x1="11" y1="14" x2="11.01" y2="14"/>
          </svg>
        </div>

        {/* 404 */}
        <div style={{
          fontSize: "clamp(5rem,16vw,10rem)", fontWeight: 900, letterSpacing: "-6px", lineHeight: 1,
          background: "linear-gradient(135deg, #fbbf24 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>404</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.3px" }}>
            Page introuvable
          </div>
          <div style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.6, maxWidth: 280 }}>
            Cette page n'existe pas ou a été déplacée.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Link href="/"
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
            style={{
              padding: "11px 22px", borderRadius: 12, textDecoration: "none",
              background: "#fbbf24", transition: "opacity 0.15s, transform 0.15s",
              color: "#0a0a0a", fontWeight: 800, fontSize: "0.88rem",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Accueil
          </Link>
          <Link href="/hub"
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
            style={{
              padding: "11px 22px", borderRadius: 12, textDecoration: "none",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8", fontWeight: 700, fontSize: "0.88rem", transition: "background 0.15s, transform 0.15s",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Hub
          </Link>
        </div>
      </div>
    </main>
  );
}
