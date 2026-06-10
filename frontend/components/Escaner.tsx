"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type ViewMode = "camera" | "preview";

export const Escaner = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("camera");
  const [showFlash, setShowFlash] = useState(false);

  // Transcription state
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);

  /* ─── Camera ─── */
  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCameraReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta acceso a la cámara.");
      setLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error(err);
      const name = err?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Acceso denegado: permite el uso de la cámara en la configuración del navegador.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No se encontró una cámara disponible.");
      } else if (name === "NotReadableError") {
        setError("La cámara está siendo usada por otra aplicación.");
      } else {
        setError("No se pudo acceder a la cámara. Revisa permisos o usa HTTPS.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  /* ─── Capture ─── */
  const capture = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(data);
    setViewMode("preview");
    setTranscription(null);
    setTranscribeError(null);
    setShowTranscription(false);

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 350);
  }, [cameraReady]);

  /* ─── Back to camera ─── */
  const backToCamera = useCallback(() => {
    setViewMode("camera");
    setPreview(null);
    setTranscription(null);
    setTranscribeError(null);
    setShowTranscription(false);
  }, []);

  /* ─── Download ─── */
  const downloadCapture = useCallback(
    (filename = "scanvision-captura.jpg") => {
      if (!preview) return;
      const link = document.createElement("a");
      link.href = preview;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [preview]
  );

  /* ─── Transcribe ─── */
  const transcribe = useCallback(async () => {
    if (!preview) return;
    setIsTranscribing(true);
    setTranscribeError(null);
    setShowTranscription(true);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al transcribir.");
      }

      setTranscription(data.text);
    } catch (err: any) {
      console.error(err);
      setTranscribeError(err.message || "Error al transcribir la imagen.");
    } finally {
      setIsTranscribing(false);
    }
  }, [preview]);

  /* ─── Copy to clipboard ─── */
  const copyTranscription = useCallback(async () => {
    if (!transcription) return;
    try {
      await navigator.clipboard.writeText(transcription);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = transcription;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }, [transcription]);

  /* ─── Keyboard shortcuts (only when not typing in an input) ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (viewMode === "camera" && cameraReady) capture();
      }
      if (e.key === "Escape" && viewMode === "preview") {
        backToCamera();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cameraReady, viewMode, capture, backToCamera]);

  /* ─── Expose state for parent (Header) ─── */
  // We use a custom event to pass state up since Header is a sibling
  useEffect(() => {
    const event = new CustomEvent("scanner-state", {
      detail: { cameraReady, isTranscribing },
    });
    window.dispatchEvent(event);
  }, [cameraReady, isTranscribing]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* ─── Main Content Area ─── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          position: "relative",
          paddingTop: "68px", // header height
          overflow: "hidden",
        }}
      >
        {/* ─── Camera / Preview View ─── */}
        <div
          style={{
            flex: showTranscription ? "0 0 55%" : "1",
            position: "relative",
            transition: "flex 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Camera Feed */}
          {viewMode === "camera" && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                aria-label="Vista de cámara para escaneo"
              />

              {/* Scanner Overlay */}
              {cameraReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "80%",
                      maxWidth: "440px",
                      aspectRatio: "3/4",
                      position: "relative",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                    }}
                  >
                    <div className="scanner-corner scanner-corner--tl" />
                    <div className="scanner-corner scanner-corner--tr" />
                    <div className="scanner-corner scanner-corner--bl" />
                    <div className="scanner-corner scanner-corner--br" />
                    <div className="scanner-line" />

                    {/* Center hint */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.6)",
                          margin: 0,
                          textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                          fontWeight: 500,
                        }}
                      >
                        Alinea el documento dentro del marco
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading / Error states */}
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-primary)",
                    gap: "16px",
                  }}
                >
                  <div
                    className="animate-pulseGlow"
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      border: "3px solid var(--accent-primary)",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite, pulseGlow 2s ease-in-out infinite",
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Iniciando cámara...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div
                  className="animate-fadeIn"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-primary)",
                    gap: "16px",
                    padding: "32px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p style={{ color: "#f87171", fontSize: "0.9rem", maxWidth: "320px", lineHeight: 1.6 }}>
                    {error}
                  </p>
                  <button
                    className="action-btn action-btn--primary"
                    onClick={() => {
                      if (streamRef.current) {
                        streamRef.current.getTracks().forEach((t) => t.stop());
                        streamRef.current = null;
                      }
                      startCamera();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Reintentar
                  </button>
                </div>
              )}
            </>
          )}

          {/* Preview of captured image */}
          {viewMode === "preview" && preview && (
            <img
              src={preview}
              alt="Imagen capturada"
              className="animate-fadeIn"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#0a0a0a",
              }}
            />
          )}

          {/* Flash Effect */}
          {showFlash && <div className="capture-flash" />}
        </div>

        {/* ─── Transcription Panel ─── */}
        {showTranscription && (
          <div
            className="animate-slideInRight"
            style={{
              flex: "0 0 45%",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-secondary)",
              borderLeft: "1px solid var(--border-glass)",
              overflow: "hidden",
            }}
          >
            {/* Panel Header */}
            <div
              className="glass"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Transcripción</span>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                {transcription && (
                  <button
                    className="action-btn action-btn--secondary"
                    onClick={copyTranscription}
                    title="Copiar al portapapeles"
                    style={{ padding: "6px 12px" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar
                  </button>
                )}
                <button
                  className="action-btn action-btn--danger"
                  onClick={() => setShowTranscription(false)}
                  style={{ padding: "6px 12px" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 20px",
              }}
            >
              {isTranscribing && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{
                        height: "14px",
                        borderRadius: "6px",
                        width: `${85 - i * 10}%`,
                      }}
                    />
                  ))}
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--text-secondary)",
                      fontSize: "0.82rem",
                      marginTop: "16px",
                    }}
                  >
                    Analizando imagen con Gemini AI...
                  </p>
                </div>
              )}

              {transcribeError && !isTranscribing && (
                <div
                  className="animate-fadeIn"
                  style={{
                    padding: "20px",
                    background: "rgba(239, 68, 68, 0.08)",
                    borderRadius: "12px",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0 0 12px" }}>
                    {transcribeError}
                  </p>
                  <button className="action-btn action-btn--primary" onClick={transcribe}>
                    Reintentar
                  </button>
                </div>
              )}

              {transcription && !isTranscribing && (
                <div className="transcription-text animate-fadeIn">{transcription}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Controls ─── */}
      <div
        className="glass-strong animate-slideUp"
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          position: "relative",
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {viewMode === "camera" ? (
          /* Camera controls */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            {/* Left: Retry */}
            <button
              className="action-btn action-btn--secondary"
              onClick={() => {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop());
                  streamRef.current = null;
                }
                startCamera();
              }}
              title="Reiniciar cámara"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {/* Center: Capture */}
            <button
              className="capture-btn"
              onClick={capture}
              disabled={!cameraReady}
              aria-label="Capturar imagen"
              title="Capturar (Espacio / Enter)"
            >
              <div className="capture-btn__inner" />
            </button>

            {/* Right: Status text */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textAlign: "center",
                minWidth: "80px",
              }}
            >
              {loading
                ? "Cargando..."
                : cameraReady
                  ? "Presiona para capturar"
                  : "Sin cámara"}
            </div>
          </div>
        ) : (
          /* Preview controls */
          <div
            className="animate-fadeIn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button className="action-btn action-btn--secondary" onClick={backToCamera}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Nueva captura
            </button>

            <button className="action-btn action-btn--primary" onClick={transcribe} disabled={isTranscribing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {isTranscribing ? "Transcribiendo..." : "Transcribir con IA"}
            </button>

            <button className="action-btn action-btn--success" onClick={() => downloadCapture()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};