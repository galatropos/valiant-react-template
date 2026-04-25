/**
 * @global
 * @typedef {object} mraid
 * @property {function} open
 */

let __cleanup = null;
let __lock = false;
let __lockTimer = null;

export const openUrl = () => {
  try {
    const mraid = typeof window !== "undefined" ? window.mraid : undefined;
    if (mraid && typeof mraid.open === "function") {
      mraid.open(); // ✅ EXACTO como lo quieres
      console.log("openUrl: mraid.open() called");
      return;
    }
    console.log("openUrl: no mraid (nothing to do)");
  } catch (e) {
    console.error("Error in openUrl:", e);
  }
};

/**
 * Registra UN SOLO listener global y dispara 1 vez por click.
 * Usa document + capture para que no lo bloquee tu app/playable.
 */
export const registerOpenOnClick = (options) => {
  if (typeof document === "undefined") return () => {};

  // ✅ elimina listener previo si ya existía
  if (typeof __cleanup === "function") {
    __cleanup();
    __cleanup = null;
  }

  const eventType = options?.eventType || "click"; // ✅ fuerza "click" por defecto

  const handler = (ev) => {
    // ✅ 1 vez por click (anti-doble disparo)
    if (__lock) return;
    __lock = true;

    if (__lockTimer) clearTimeout(__lockTimer);
    __lockTimer = setTimeout(() => {
      __lock = false;
    }, 250);

    openUrl(); // ✅ solo mraid.open()
  };

  // ✅ CAPTURE TRUE: entra aunque hagan stopPropagation()
  document.addEventListener(eventType, handler, { capture: true, passive: true });

  __cleanup = () => {
    document.removeEventListener(eventType, handler, { capture: true });
    if (__lockTimer) {
      clearTimeout(__lockTimer);
      __lockTimer = null;
    }
    __lock = false;
  };

  return __cleanup;
};
