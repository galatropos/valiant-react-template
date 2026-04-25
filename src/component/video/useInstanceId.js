// 🆔 Genera un id corto estable por instancia (p.ej., "vp-a1b2c3").
// Útil para registrar cosas en window.players[id] y depurar varios players.
import { useRef } from "react";

export default function useInstanceId(prefix = "vp") {
  const ref = useRef(null);
  if (!ref.current) {
    const rnd = Math.random().toString(36).slice(2, 8);
    ref.current = `${prefix}-${rnd}`;
  }
  return ref.current;
}
