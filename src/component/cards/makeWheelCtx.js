// src/component/cards/makeWheelCtx.js
// Crea un wheelCtx completo que conecta tus defaults/enums de banks.js
// y expone los setters/leedores que CardDevLayer espera.
// ✅ Pega este archivo y luego: import createWheelCtx from "./makeWheelCtx";
// ✅ Asegúrate de tener banks.js como lo compartiste y pasar este ctx a CardDevLayer.

import {
  defaultPercent,
  ENUM_OPTIONS,
  ENUM_DEFAULTS,
  WHEEL_STEP,
  BOUNDS,
} from "./banks";

/**
 * Crea un contexto de rueda/orientación coherente con CardDevLayer.
 * - Mantiene "extras" por orientación (portrait/landscape) para numéricos.
 * - Gestiona ENUMS con opciones y defaults (display, background*, etc.).
 * - Ofrece getters/setters que CardDevLayer consume en su wheel handler.
 */
export default function createWheelCtx(opts = {}) {
  const {
    isPortraitInitial = true,
    fontStepPct = 1, // paso % para font (usado por CardDevLayer)
  } = opts;

  let isPortrait = !!isPortraitInitial;

  // ===== ENUM state =====
  // Inicia con defaults declarados en ENUM_DEFAULTS
  const enumState = new Map();
  Object.keys(ENUM_DEFAULTS || {}).forEach((k) => enumState.set(k, ENUM_DEFAULTS[k]));

  // ===== Extras numéricos por orientación =====
  const extrasPortrait = Object.create(null);
  const extrasLandscape = Object.create(null);

  const getExtrasMap = () => (isPortrait ? extrasPortrait : extrasLandscape);

  // ===== Utilidades numéricas =====
  const getExtra = (key) => {
    const m = getExtrasMap();
    const v = m[key];
    return Number.isFinite(v) ? v : 0;
  };

  const setExtraExact = (key, extra) => {
    const m = getExtrasMap();
    m[key] = Number(extra) || 0;
  };

  const getAbsoluteOrNull = (key) => {
    // Si es enum, devuelve su valor actual
    if (ENUM_OPTIONS && Object.prototype.hasOwnProperty.call(ENUM_OPTIONS, key)) {
      return enumState.get(key);
    }
    // Para numéricos: defaultPercent + extra (si hay default conocido)
    const base = Number.isFinite(defaultPercent?.[key]) ? Number(defaultPercent[key]) : null;
    if (base == null) return null;
    return base + getExtra(key);
  };

  // ===== ENUMS =====
  const getEnumValue = (key) => {
    return enumState.get(key);
  };

  const setEnumValue = (key, value) => {
    const opts = ENUM_OPTIONS?.[key];
    if (Array.isArray(opts) && opts.includes(value)) {
      enumState.set(key, value);
    }
  };

  // ===== Setters POR ORIENTACIÓN que espera CardDevLayer (funcional signature: (fn) => {...}) =====
  // Crea un setter estilo React: recibe fn(prevExtra) -> nextExtra
  const mkSetter = (map, key) => (fn) => {
    const prev = Number.isFinite(map[key]) ? map[key] : 0;
    const next = typeof fn === "function" ? fn(prev) : Number(fn) || 0;
    map[key] = next;
  };

  // Portrait
  const setFontBaseDeltaPctPortrait   = mkSetter(extrasPortrait, "font");
  const setOpacityBaseDeltaPortrait   = mkSetter(extrasPortrait, "opacity");
  const setRotateBaseDeltaPortrait    = mkSetter(extrasPortrait, "rotate");
  const setScaleBaseDeltaPortrait     = mkSetter(extrasPortrait, "scale");
  const setScaleXBaseDeltaPortrait    = mkSetter(extrasPortrait, "scaleX");
  const setScaleYBaseDeltaPortrait    = mkSetter(extrasPortrait, "scaleY");
  const setRotateXBaseDeltaPortrait   = mkSetter(extrasPortrait, "rotateX");
  const setRotateYBaseDeltaPortrait   = mkSetter(extrasPortrait, "rotateY");
  const setBlurBaseDeltaPortrait      = mkSetter(extrasPortrait, "blur");
  const setBackdropBaseDeltaPortrait  = mkSetter(extrasPortrait, "backdropBlur");

  // Landscape
  const setFontBaseDeltaPctLandscape  = mkSetter(extrasLandscape, "font");
  const setOpacityBaseDeltaLandscape  = mkSetter(extrasLandscape, "opacity");
  const setRotateBaseDeltaLandscape   = mkSetter(extrasLandscape, "rotate");
  const setScaleBaseDeltaLandscape    = mkSetter(extrasLandscape, "scale");
  const setScaleXBaseDeltaLandscape   = mkSetter(extrasLandscape, "scaleX");
  const setScaleYBaseDeltaLandscape   = mkSetter(extrasLandscape, "scaleY");
  const setRotateXBaseDeltaLandscape  = mkSetter(extrasLandscape, "rotateX");
  const setRotateYBaseDeltaLandscape  = mkSetter(extrasLandscape, "rotateY");
  const setBlurBaseDeltaLandscape     = mkSetter(extrasLandscape, "blur");
  const setBackdropBaseDeltaLandscape = mkSetter(extrasLandscape, "backdropBlur");

  // ===== API pública =====
  return {
    // Orientación
    get isPortrait() { return isPortrait; },
    setIsPortrait: (v) => { isPortrait = !!v; },

    // Defaults/enums/pasos/bounds (CardDevLayer los lee)
    defaultPercent,
    ENUM_OPTIONS,
    ENUM_DEFAULTS,
    WHEEL_STEP,
    BOUNDS,
    fontStepPct,

    // Enum helpers
    getEnumValue,
    setEnumValue,

    // Num helpers
    getAbsoluteOrNull,
    setExtraExact,
    getExtra,

    // Setters por orientación que CardDevLayer invoca
    setFontBaseDeltaPctPortrait,
    setOpacityBaseDeltaPortrait,
    setRotateBaseDeltaPortrait,
    setScaleBaseDeltaPortrait,
    setScaleXBaseDeltaPortrait,
    setScaleYBaseDeltaPortrait,
    setRotateXBaseDeltaPortrait,
    setRotateYBaseDeltaPortrait,
    setBlurBaseDeltaPortrait,
    setBackdropBaseDeltaPortrait,

    setFontBaseDeltaPctLandscape,
    setOpacityBaseDeltaLandscape,
    setRotateBaseDeltaLandscape,
    setScaleBaseDeltaLandscape,
    setScaleXBaseDeltaLandscape,
    setScaleYBaseDeltaLandscape,
    setRotateXBaseDeltaLandscape,
    setRotateYBaseDeltaLandscape,
    setBlurBaseDeltaLandscape,
    setBackdropBaseDeltaLandscape,
  };
}
