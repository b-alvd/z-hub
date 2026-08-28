"use client";
export default function LoginPage() {
  return (
    <main style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#030b07",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: 340, padding: "44px 36px", borderRadius: 24,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: 24,
        alignItems: "center", textAlign: "center",
      }}>
        <div>
          <div style={{
            fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-2px", paddingRight: 4,
            background: "linear-gradient(120deg,#fbbf24,#ef4444)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}>Z-HUB</div>
          <div style={{ fontSize: "0.82rem", color: "#374151" }}>
            Connecte-toi pour jouer
          </div>
        </div>

        <a href="/api/auth/discord" style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "13px", borderRadius: 12, textDecoration: "none",
          background: "#5865F2", color: "#fff", fontWeight: 800, fontSize: "0.92rem",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="20" height="20" viewBox="-0.5 1.5 15 13" overflow="visible" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.384 8.384 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/></svg>
          Continuer avec Discord
        </a>

        <div style={{ fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.6 }}>
          Pas encore de compte ? Discord en crée un automatiquement.
        </div>
      </div>
    </main>
  );
}
