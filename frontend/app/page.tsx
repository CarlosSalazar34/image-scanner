"use client";

import { Escaner } from "@/components/Escaner";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";

export default function Home() {
  const [cameraReady, setCameraReady] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCameraReady(detail.cameraReady);
      setIsTranscribing(detail.isTranscribing);
    };
    window.addEventListener("scanner-state", handler);
    return () => window.removeEventListener("scanner-state", handler);
  }, []);

  return (
    <>
      <Header cameraReady={cameraReady} isTranscribing={isTranscribing} />
      <Escaner />
    </>
  );
}
