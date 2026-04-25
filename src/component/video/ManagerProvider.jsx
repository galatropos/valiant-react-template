// ManagerProvider.jsx — React wrapper para TimelineManager (sin Next)
import React, { createContext, useContext, useEffect, useMemo } from "react";
import TimelineManager from "./Manager.js";

const ManagerContext = createContext(null);

/**
 * Props:
 * - durationMs?: number
 * - initialVelocity?: number (default 1)
 * - autoplay?: boolean (si true: manager.play() al montar)
 * - exposeWindow?: boolean (default true) → window.manager = manager para debug
 */
export function ManagerProvider({
  durationMs = 0,
  initialVelocity = 1,
  autoplay = false,
  exposeWindow = true,
  children,
}) {
  // Instancia única por Provider
  const manager = useMemo(() => new TimelineManager({ durationMs }), [durationMs]);

  // Config inicial
  useEffect(() => {
    manager.setVelocity(initialVelocity);
  }, [manager, initialVelocity]);

  // Autoplay opcional al montar
  useEffect(() => {
    if (autoplay) manager.play();
    // no cleanup necesario; manager vive mientras viva el Provider
  }, [manager, autoplay]);

  // Exponer en window para consola (opcional)
  useEffect(() => {
    if (!exposeWindow) return;
    window.manager = manager;
    return () => {
      if (window.manager === manager) delete window.manager;
    };
  }, [manager, exposeWindow]);

  return (
    <ManagerContext.Provider value={manager}>
      {children}
    </ManagerContext.Provider>
  );
}

// Hook para acceder al manager
export function useManager() {
  const ctx = useContext(ManagerContext);
  if (!ctx) {
    throw new Error("useManager debe usarse dentro de <ManagerProvider>.");
  }
  return ctx;
}
