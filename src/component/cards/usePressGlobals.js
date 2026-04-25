import { useEffect } from "react";

/**
 * usePressGlobals
 * Encapsula los listeners globales de pointer para soportar los "Press global":
 * - onPressMoveEnter / onPressMoveLeave cuando el pointer cruza el elemento durante una pulsación
 * - onPressEndInside / onPressEndOutside al soltar dentro/fuera
 *
 * Requiere las mismas refs que ya maneja Card para no cambiar el comportamiento:
 *   activePointerIdRef, isPressingRef, leftFiredRef, enteredDuringPressRef, downRectRef, endFiredRef
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.myDiv - ref del elemento del card
 * @param {React.RefObject<number|null>} params.activePointerIdRef
 * @param {React.RefObject<boolean>} params.isPressingRef
 * @param {React.RefObject<boolean>} params.leftFiredRef
 * @param {React.RefObject<DOMRect|null>} params.downRectRef
 * @param {React.RefObject<boolean>} params.enteredDuringPressRef
 * @param {React.RefObject<boolean>} params.endFiredRef
 * @param {(e: PointerEvent) => void} [params.onPressMoveEnter]
 * @param {(e: PointerEvent) => void} [params.onPressMoveLeave]
 * @param {(e: PointerEvent) => void} [params.onPressEndInside]
 * @param {(e: PointerEvent) => void} [params.onPressEndOutside]
 */
export default function usePressGlobals({
   referencia123,
  activePointerIdRef,
  isPressingRef,
  leftFiredRef,
  downRectRef,
  enteredDuringPressRef,
  endFiredRef,
  onPressMoveEnter,
  onPressMoveLeave,
  onPressEndInside,
  onPressEndOutside,
}) {
  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      if (activePointerIdRef.current != null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activePointerIdRef.current = e.pointerId;
      isPressingRef.current = true;
      leftFiredRef.current = false;
      enteredDuringPressRef.current = false;
      downRectRef.current = null;
      endFiredRef.current = false;
    };

    const handleGlobalPointerMove = (e) => {
      if (!isPressingRef.current || activePointerIdRef.current !== e.pointerId) return;
      const rect = referencia123.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (inside && !enteredDuringPressRef.current) {
        enteredDuringPressRef.current = true;
        onPressMoveEnter?.(e);
      } else if (!inside && enteredDuringPressRef.current) {
        enteredDuringPressRef.current = false;
        onPressMoveLeave?.(e);
      }
    };

    const handleGlobalPointerUp = (e) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      const rect = referencia123.current?.getBoundingClientRect();
      if (rect) {
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (inside && !endFiredRef.current) {
          endFiredRef.current = true;
          onPressEndInside?.(e);
        } else if ( !inside && enteredDuringPressRef.current && !endFiredRef.current) {
          endFiredRef.current = true;
          onPressEndOutside?.(e);
        }
      }
      activePointerIdRef.current = null;
      isPressingRef.current = false;
      leftFiredRef.current = false;
      enteredDuringPressRef.current = false;
      downRectRef.current = null;
      endFiredRef.current = false;
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [
    referencia123,
    activePointerIdRef,
    isPressingRef,
    leftFiredRef,
    downRectRef,
    enteredDuringPressRef,
    endFiredRef,
    onPressMoveEnter,
    onPressMoveLeave,
    onPressEndInside,
    onPressEndOutside,
  ]);
}
