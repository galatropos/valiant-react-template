// 🔎 Detecta orientación del viewport: "portrait" | "landscape".
// Úsalo cuando necesites cambiar layout/recursos por orientación.
import { useEffect, useState } from "react";

export default function useOrientationMode() {
  const getIsPortrait = () => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      return window.matchMedia("(orientation: portrait)").matches;
    }
    return typeof window !== "undefined"
      ? window.innerHeight >= window.innerWidth
      : true;
  };

  const [mode, setMode] = useState(getIsPortrait() ? "portrait" : "landscape");

  useEffect(() => {
    const onChange = () => setMode(getIsPortrait() ? "portrait" : "landscape");
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener?.("change", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      mq.removeEventListener?.("change", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return mode;
}
