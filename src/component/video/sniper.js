// src/component/video/sniper.js
// Paso 8 — Sniper headless: logging de snapshots y eventos, solo consola.

export default function attachSniper(manager) {
  const state = {
    timer: 0,
    intervalMs: 1000,
    logEvents: true,
  };

  const api = {
    /** Imprime el snapshot actual del manager */
    capture() {
      try {
        const snap = manager.getSnapshot();
        console.log("[sniper.capture]", snap);
      } catch (err) {
        console.warn("[sniper.capture] error:", err);
      }
    },

    /** Activa logging periódico de snapshots (cada ms) */
    enableLogging(ms = 1000) {
      const n = Number(ms);
      state.intervalMs = Number.isFinite(n) ? Math.max(100, Math.floor(n)) : 1000;
      if (state.timer) clearInterval(state.timer);
      state.timer = setInterval(() => api.capture(), state.intervalMs);
      console.info(`[sniper] logging cada ${state.intervalMs}ms`);
    },

    /** Desactiva logging periódico */
    disableLogging() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = 0;
      }
      console.info("[sniper] logging desactivado");
    },

    /** Log manual de eventos arbitrarios (útil desde callbacks de bloques) */
    log(event) {
      console.log("[sniper.event]", event);
    },

    /** Hook interno: invocado por el Manager en _emit() */
    _onManagerEvent(name, payload) {
      if (!state.logEvents) return;
      if (name === "blockTick") return; // evita ruido
      try {
        console.log(`[sniper.${name}]`, {
          id: payload?.blockId,
          action: payload?.action,
          tMs: payload?.tMs,
        });
      } catch {}
    },
  };

  return api;
}
