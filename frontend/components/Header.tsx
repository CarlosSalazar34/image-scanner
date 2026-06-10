"use client";

interface HeaderProps {
  cameraReady: boolean;
  isTranscribing: boolean;
}

export const Header = ({ cameraReady, isTranscribing }: HeaderProps) => {
  return (
    <header
      className="glass-strong animate-fadeIn"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px var(--accent-glow)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </div>
        <div>
          <h1
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.7))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ScanVision
          </h1>
          <p
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              margin: 0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Escáner Inteligente
          </p>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {isTranscribing && (
          <div
            className="status-badge status-badge--loading animate-fadeIn"
          >
            <div className="status-dot" />
            Procesando
          </div>
        )}
        <div
          className={`status-badge ${
            cameraReady ? "status-badge--ready" : "status-badge--error"
          }`}
        >
          <div className="status-dot" />
          {cameraReady ? "Cámara activa" : "Sin cámara"}
        </div>
      </div>
    </header>
  );
};