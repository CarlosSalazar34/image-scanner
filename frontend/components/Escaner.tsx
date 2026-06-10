
"use client";

import { useEffect, useRef, useState } from "react";

export const Escaner = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Tu navegador no soporta acceso a la cámara.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo acceder a la cámara. Revisa permisos o usa HTTPS.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-90 m-3">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={640}
        height={480}
        className="rounded-md bg-black"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <button
        disabled={!cameraReady}
        className="mt-auto bg-linear-to-tl from-blue-300 to-rose-300 rounded-sm p-2 active:scale-95 outline-0 transition-all disabled:opacity-50"
      >
        Escanear
      </button>
    </div>
  );
};