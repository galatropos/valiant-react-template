// src/component/video/constants.js
// Tolerancias, ventanas de robustez y parámetros de sincronía suave

export const FRAME_TOL_MS       = 16.7;  // ~1 frame a 60fps
export const CUE_WINDOW_MS      = 8;     // ventana para bordes de bloques (anti-rebote)

// Desalineo y seeks
export const DRIFT_SOFT_MS      = 80;    // tolerancia antes de corregir con rate nudging
export const DRIFT_HARD_MS      = 300;   // umbral para hard-seek inmediato
export const HYST_AFTER_SEEK_MS = 30;    // histeresis breve tras cualquier seek
export const HYST_AFTER_LOOP_MS = 30;    // histeresis tras saltos de loop (faltaba esta export)

// Sincronía suave (ajuste de playbackRate)
export const SYNC_NUDGE_MAX     = 0.05;  // ±5% máx
export const SYNC_KP            = 0.002; // ganancia proporcional (ms -> delta de rate)
export const SYNC_ZERO_BAND_MS  = 12;    // zona muerta: vuelve a 1.0 si |drift| < 12ms
export const SYNC_BACKOFF_MS    = 500;   // mínimo entre cambios “grandes” de rate
