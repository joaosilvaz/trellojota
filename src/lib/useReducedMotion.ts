"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";

/** true quando o sistema pede movimento reduzido ou o usuário escolheu "Reduzidas" */
export function useReducedMotion() {
  const { state } = useStore();
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystem(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return system || state?.settings.reducedMotion === "reduce";
}
