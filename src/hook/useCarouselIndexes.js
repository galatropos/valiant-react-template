// hook/useCarouselIndexes.js
import { useState, useRef, useCallback } from "react";

/**
 * Mantiene un carrusel por clicks.
 * - right(): crea a la derecha (push) y elimina a la izquierda (shift) → índices suben
 * - left() : crea a la izquierda (unshift) y elimina a la derecha (pop) → índices bajan
 * Devuelve:
 *   - indexArray: números 0..sizeElement-1 según tu lógica
 *   - keys: ids únicos por instancia para usar como key en el render
 */
export default function useCarouselIndexes(initialArray, sizeElement) {
  const safeInit = Array.isArray(initialArray) ? initialArray : [];
  const [indexArray, setIndexArray] = useState(() => [...safeInit]);
  const [keys, setKeys] = useState(() =>
    Array.from({ length: safeInit.length }, (_, i) => i)
  );
  const keySeqRef = useRef(keys.length);

  const right = useCallback(() => {
    setIndexArray(prev => {
      if (!prev.length || sizeElement <= 0) return prev;

      // índices: shift/push con incremento
      const last = prev[prev.length - 1];
      const next = (last + 1) % sizeElement;
      const nextIndexes = prev.slice(1);
      nextIndexes.push(next);

      // keys: shift/push (nuevo id para el que entra)
      setKeys(prevKeys => {
        const nk = prevKeys.slice(1);
        nk.push(keySeqRef.current++);
        return nk;
      });

      return nextIndexes;
    });
  }, [sizeElement]);

  const left = useCallback(() => {
    setIndexArray(prev => {
      if (!prev.length || sizeElement <= 0) return prev;

      // índices: unshift/pop con decremento
      const first = prev[0];
      const next = (first - 1 + sizeElement) % sizeElement;
      const nextIndexes = prev.slice(0, -1);
      nextIndexes.unshift(next);

      // keys: unshift/pop (nuevo id para el que entra)
      setKeys(prevKeys => {
        const nk = prevKeys.slice(0, -1);
        nk.unshift(keySeqRef.current++);
        return nk;
      });

      return nextIndexes;
    });
  }, [sizeElement]);

  const reset = useCallback(() => {
    setIndexArray([...safeInit]);
    setKeys(Array.from({ length: safeInit.length }, (_, i) => i));
    keySeqRef.current = safeInit.length;
  }, [safeInit]);

  return { indexArray, keys, left, right, reset };
}
