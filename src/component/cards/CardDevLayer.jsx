// src/component/cards/CardDevLayer.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GuideCards from "./GuideCards";
import Command from "./Command";
import DevTopBar from "./DevTopBar";
import {
  COMMAND_BANKS,
  COMMAND_BANKS_ENUM,
  COMMAND_LABELS_BANKS,
  defaultPercent,
  ENUM_DEFAULTS,
} from "./banks";

/**
 * CardDevLayer — Singleton DevTopBar visible en contexto activo:
 *   near OR hover OR focus OR topBarPointerHold, o cuando hay tecla de modo presionada.
 * - KEYMASTER: solo una instancia escucha las teclas de alias (evita doble toggle).
 * - "2" (copiar) se enruta al owner; si no hay owner, se difunde a la(s) instancia(s) near/hover/focus.
 * - La rueda solo actúa si eres owner.
 *
 * Alias soportados: 1 letra (p.ej. "s") y 2 letras en secuencia (p.ej. "bf").
 */
export default function CardDevLayer(props) {
  const {
    id,
    isDevMode,
    guide = "auto",
    colorGuide = "red",
    myDiv,
    computeGuideMidlines,
    hoveredRef,
    focusedRef,
    hovered,
    setHovered,
    focused,
    setFocused,
    topBarKeyHeld,
    setTopBarKeyHeld,
    topBarPointerHold,
    setTopBarPointerHold,
    showHelp,
    setShowHelp,
    showBlack,
    setShowBlack,
    activeGroup,
    setActiveGroup,
    blackLabel,
    setBlackLabel,
    guideMid,
    setGuideMid,
    legendDisplayText,
    isEligibleForHotkeys,
    updateResizeCursor,
    wheelCtx,
    xywhLive,
    /* Runtime directo del Card */
    liveRef,
    resolveValue,
    resolveXYWH,
    resolveBulk,
    subscribe,
    /* Medición visual opcional y contenedor */
    measureRef,
    containerRef,
    measureSelector,
    liveWH,
  } = props;

  const xywhFromCard = xywhLive || null;

  // ===== Claves globales =====
  const ownerKey = "__CARD_DEV_ACTIVE_ID__";
  const topbarOwnerKey = "__CARD_DEV_TOPBAR_OWNER__";
  const topbarModeKey = "__CARD_DEV_TOPBAR_MODE__";
  const keymasterKey = "__CARD_DEV_KEYMASTER__";
  const COPY_EVENT = "__CARD_DEV_REQUEST_COPY__";
  const TOPBAR_CONTAINER_ID = "card-devtopbar-layer";

  // Helpers globales
  const getGlobalMode = () => {
    try {
      return window[topbarModeKey] || null;
    } catch {
      return null;
    }
  };
  const setGlobalMode = (mode) => {
    try {
      window[topbarModeKey] = mode || null;
    } catch {}
  };

  const idRef = useRef(
    (id ? String(id) + "_" : "") +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36).slice(2)
  );
  const claimActive = () => {
    try {
      window[ownerKey] = idRef.current;
    } catch (e) {}
  };
  const releaseIfOwner = () => {
    try {
      if (window[ownerKey] === idRef.current) window[ownerKey] = null;
    } catch (e) {}
  };
  const isOwner = () => {
    try {
      return window[ownerKey] === idRef.current;
    } catch (e) {
      return false;
    }
  };

  const claimTopbar = () => {
    try {
      window[topbarOwnerKey] = idRef.current;
    } catch (e) {}
  };
  const releaseTopbarIfOwner = () => {
    try {
      if (window[topbarOwnerKey] === idRef.current)
        window[topbarOwnerKey] = null;
    } catch (e) {}
  };
  const isTopbarOwner = () => {
    try {
      return window[topbarOwnerKey] === idRef.current;
    } catch (e) {
      return false;
    }
  };

  const ensureTopbarContainer = () => {
    let el = null;
    try {
      el = document.getElementById(TOPBAR_CONTAINER_ID);
    } catch (e) {}
    if (!el) {
      try {
        el = document.createElement("div");
        el.id = TOPBAR_CONTAINER_ID;
        el.style.position = "fixed";
        el.style.top = "0";
        el.style.left = "0";
        el.style.right = "0";
        el.style.zIndex = "999999";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
      } catch (e) {}
    }
    return el;
  };

  // ===== Estado de proximidad =====
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  nearRef.current = near;

  // === Helper de contexto activo
  const isActiveContext = near || hovered || focused || topBarPointerHold;

  // Proximidad por rect + padding
  useEffect(() => {
    if (!isDevMode) return;
    let lastEvt = null;
    let raf = 0;
    const PAD = 24;

    const computeNear = () => {
      raf = 0;
      const host = myDiv?.current;
      if (!host) return;
      let inside = false;
      if (lastEvt) {
        const r = host.getBoundingClientRect?.();
        if (r) {
          const x = lastEvt.clientX;
          const y = lastEvt.clientY;
          inside =
            x >= r.left - PAD &&
            x <= r.right + PAD &&
            y >= r.top - PAD &&
            y <= r.bottom + PAD;
        }
      } else {
        try {
          inside = host.matches && host.matches(":hover");
        } catch {}
      }
      if (inside !== nearRef.current) setNear(inside);
    };

    const onMove = (e) => {
      lastEvt = e;
      if (!raf) raf = requestAnimationFrame(computeNear);
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    const host = myDiv?.current;
    const onEnter = () => setNear(true);
    const onLeave = () => setNear(false);
    try {
      host?.addEventListener("pointerenter", onEnter);
      host?.addEventListener("pointerleave", onLeave);
    } catch {}

    setTimeout(computeNear, 0);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      try {
        host?.removeEventListener("pointerenter", onEnter);
        host?.removeEventListener("pointerleave", onLeave);
      } catch {}
    };
  }, [isDevMode, myDiv]);

  // Reclamar/soltar owner por proximidad/hover/focus
  useEffect(() => {
    if (!isDevMode) return;
    if (hovered || focused || topBarPointerHold || near) claimActive();
    else releaseIfOwner();
  }, [isDevMode, hovered, focused, topBarPointerHold, near]);

  // Transferir propiedad del TopBar según contexto activo
  useEffect(() => {
    if (!isDevMode) return;
    if (
      (isActiveContext || topBarKeyHeld) &&
      (getGlobalMode() || flashTextRef.current) &&
      !isTopbarOwner()
    ) {
      claimTopbar();
    }
    if (!isActiveContext && !topBarKeyHeld && isTopbarOwner()) {
      releaseTopbarIfOwner();
    }
  }, [isDevMode, near, hovered, focused, topBarPointerHold, topBarKeyHeld]);

  useEffect(
    () => () => {
      releaseIfOwner();
      releaseTopbarIfOwner();
      try {
        if (window[keymasterKey] === idRef.current) window[keymasterKey] = null;
      } catch {}
    },
    []
  );

  const rafRef = useRef(0);

  // Forzar refresco cuando el runtime notifique
  const [, setTick] = useState(0);
  useEffect(() => {
    if (typeof subscribe !== "function") return;
    const unsub = subscribe(() => setTick((t) => t + 1));
    return () => {
      try {
        unsub && unsub();
      } catch (e) {}
    };
  }, [subscribe]);

  // Flash "copiado"
  const [flashText, setFlashText] = useState(null);
  const flashTextRef = useRef(null);
  useEffect(() => {
    flashTextRef.current = flashText;
  }, [flashText]);
  const flashTimerRef = useRef(null);

  // ===== Defaults por MODO =====
  const IMPLICIT_DEFAULTS = {
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    skewX: 0,
    skewY: 0,
    opacity: 1,
    blur: 0,
    backdropBlur: 0,
    hueRotate: 0,
    brightness: 1,
    contrast: 1,
    saturate: 1,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    opacityFilter: 1,
    borderWidth: 0,
    borderRadius: 0,
    outlineWidth: 0,
    outlineOffset: 0,
    padding: 0,
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: 0,
    fontWeight: 400,
    wordSpacing: 0,
    textIndent: 0,
    textDecorationThickness: 0,
    textUnderlineOffset: 0,
    gap: 0,
    rowGap: 0,
    columnGap: 0,
    zIndex: 0,
    aspectRatio: 0,
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundSizeX: 100,
    backgroundSizeY: 100,
    boxShadowOffsetX: 0,
    boxShadowOffsetY: 0,
    boxShadowBlur: 0,
    boxShadowSpread: 0,
    dropShadowOffsetX: 0,
    dropShadowOffsetY: 0,
    dropShadowBlur: 0,
    width: 0,
    height: 0,
    font: 0,
    x: 0,
    y: 0,
  };

  const collectAllModes = () => {
    const modes = new Set();
    const collectFromBanks = (obj) => {
      for (const bankId of Object.keys(obj || {})) {
        const map = obj[bankId] || {};
        for (const key of Object.values(map)) {
          const mode =
            typeof key === "string" && key.startsWith("@") ? key.slice(1) : key;
          if (mode) modes.add(mode);
        }
      }
    };
    collectFromBanks(COMMAND_BANKS || {});
    collectFromBanks(COMMAND_BANKS_ENUM || {});
    Object.keys(defaultPercent || {}).forEach((k) => modes.add(k));
    Object.keys(ENUM_DEFAULTS || {}).forEach((k) => modes.add(k));
    if (wheelCtx?.defaultPercent)
      Object.keys(wheelCtx.defaultPercent).forEach((k) => modes.add(k));
    if (wheelCtx?.ENUM_OPTIONS)
      Object.keys(wheelCtx.ENUM_OPTIONS).forEach((k) => modes.add(k));
    if (wheelCtx?.ENUM_DEFAULTS)
      Object.keys(wheelCtx.ENUM_DEFAULTS).forEach((k) => modes.add(k));
    [
      "translateX",
      "translateY",
      "width",
      "height",
      "rotate",
      "scale",
      "opacity",
      "font",
      "lineHeight",
    ].forEach((k) => modes.add(k));
    return Array.from(modes);
  };

  const getDefaultForMode = (mode) => {
    const dpCtx = wheelCtx?.defaultPercent || {};
    if (Number.isFinite(dpCtx[mode])) return dpCtx[mode];
    const enumCtx = wheelCtx?.ENUM_DEFAULTS || {};
    if (Object.prototype.hasOwnProperty.call(enumCtx, mode))
      return enumCtx[mode];
    if (Number.isFinite((defaultPercent || {})[mode]))
      return (defaultPercent || {})[mode];
    if (Object.prototype.hasOwnProperty.call(ENUM_DEFAULTS || {}, mode))
      return (ENUM_DEFAULTS || {})[mode];
    if (Object.prototype.hasOwnProperty.call(IMPLICIT_DEFAULTS, mode))
      return IMPLICIT_DEFAULTS[mode];
    return null;
  };

  // ====== Utils ======
  const toNum = (v) => {
    if (v == null) return null;
    const m = String(v).match(/[-+]?\d*\.?\d+/);
    return m ? parseFloat(m[0]) : null;
  };

  const parseComputedTransform = (str) => {
    const out = {};
    if (!str || str === "none") return out;
    const m2 = str.match(
      /matrix\(\s*([-+eE\d\.]+)\s*,\s*([-+eE\d\.]+)\s*,\s*([-+eE\d\.]+)\s*,\s*([-+eE\d\.]+)\s*,\s*([-+eE\d\.]+)\s*,\s*([-+eE\d\.]+)\s*\)/
    );
    if (m2) {
      const a = parseFloat(m2[1]),
        b = parseFloat(m2[2]),
        c = parseFloat(m2[3]),
        d = parseFloat(m2[4]);
      const tx = parseFloat(m2[5]),
        ty = parseFloat(m2[6]);
      out.translateX = tx;
      out.translateY = ty;
      const scaleX = Math.hypot(a, b);
      const scaleY = Math.hypot(c, d);
      out.scaleX = scaleX;
      out.scaleY = scaleY;
      out.scale = (scaleX + scaleY) / 2;
      const angle = Math.atan2(b, a) * (180 / Math.PI);
      out.rotate = angle;
      return out;
    }
    const m3 = str.match(/matrix3d\((.+)\)/);
    if (m3) {
      const nums = m3[1].split(",").map((s) => parseFloat(s.trim()));
      if (nums.length === 16) {
        const tx = nums[12],
          ty = nums[13];
        out.translateX = tx;
        out.translateY = ty;
        const a = nums[0],
          b = nums[1],
          c = nums[4],
          d = nums[5];
        const scaleX = Math.hypot(a, b);
        const scaleY = Math.hypot(c, d);
        out.scaleX = scaleX;
        out.scaleY = scaleY;
        out.scale = (scaleX + scaleY) / 2;
        const angle = Math.atan2(b, a) * (180 / Math.PI);
        out.rotate = angle;
      }
      return out;
    }
    return out;
  };

  // Elemento a medir
  const pickMeasureElement = () => {
    const host = myDiv?.current || null;
    if (!host) return null;
    if (measureRef?.current) return measureRef.current;
    if (measureSelector && host.querySelector) {
      const q = host.querySelector(measureSelector);
      if (q) return q;
    }
    try {
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        const cs = getComputedStyle(el);
        if (cs && cs.transform && cs.transform !== "none") {
          return el;
        }
      }
    } catch (e) {}
    return host;
  };

  // XYWH en %
  const readXYWHPercent = () => {
    const target = pickMeasureElement();
    if (!target) return {};
    const container =
      containerRef?.current ||
      target.offsetParent ||
      target.parentElement ||
      document.documentElement;

    const r = target.getBoundingClientRect();
    const rp =
      container && container.getBoundingClientRect
        ? container.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };

    const ww = rp.width || 1;
    const hh = rp.height || 1;

    const xPct = ((r.left - rp.left) / ww) * 100;
    const yPct = ((r.top - rp.top) / hh) * 100;
    const wPct = (r.width / ww) * 100;
    const hPct = (r.height / hh) * 100;

    return {
      x: Number.isFinite(xPct) ? xPct : null,
      y: Number.isFinite(yPct) ? yPct : null,
      width: Number.isFinite(wPct) ? wPct : null,
      height: Number.isFinite(hPct) ? hPct : null,
    };
  };

  // DOM → modos
  const buildPortraitDOMByMode = () => {
    const target = pickMeasureElement();
    const out = {};
    if (!target) return out;
    const cs = getComputedStyle(target);

    Object.assign(out, parseComputedTransform(cs.transform));

    const tInline = target.style?.transform || "";
    const parseInline = (t) => {
      const o = {};
      const rx = (re, key) => {
        const m = t.match(re);
        if (m) o[key] = parseFloat(m[1]);
      };
      rx(/translateX\(([-+]?\d*\.?\d+)px\)/, "translateX");
      rx(/translateY\(([-+]?\d*\.?\d+)px\)/, "translateY");
      rx(/translateZ\(([-+]?\d*\.?\d+)px\)/, "translateZ");
      rx(/scale\(([-+]?\d*\.?\d+)\)/, "scale");
      rx(/scaleX\(([-+]?\d*\.?\d+)\)/, "scaleX");
      rx(/scaleY\(([-+]?\d*\.?\d+)\)/, "scaleY");
      rx(/rotate\(([-+]?\d*\.?\d+)deg\)/, "rotate");
      rx(/rotateX\(([-+]?\d*\.?\d+)deg\)/, "rotateX");
      rx(/rotateY\(([-+]?\d*\.?\d+)deg\)/, "rotateY");
      rx(/skewX\(([-+]?\d*\.?\d+)deg\)/, "skewX");
      rx(/skewY\(([-+]?\d*\.?\d+)deg\)/, "skewY");
      return o;
    };
    Object.assign(out, parseInline(tInline));

    const parseFilter = (f) => {
      const o = {};
      if (!f || f === "none") return o;
      const rx = (name, key, unit = "") => {
        const m = f.match(
          new RegExp(
            name +
              "\\\\(([-+]?\\\\d*\\\\.?\\\\d+)" +
              (unit ? unit : "") +
              "\\\\)"
          )
        );
        if (m) o[key] = parseFloat(m[1]);
      };
      rx("blur", "blur", "px");
      rx("brightness", "brightness");
      rx("contrast", "contrast");
      rx("saturate", "saturate");
      rx("grayscale", "grayscale");
      rx("sepia", "sepia");
      rx("invert", "invert");
      rx("hue-rotate", "hueRotate", "deg");
      rx("opacity", "opacityFilter");
      return o;
    };
    Object.assign(out, parseFilter(cs.filter));

    out.opacity = toNum(cs.opacity);
    const fontPx = toNum(cs.fontSize);
    if (fontPx != null) out.font = fontPx;

    out.borderWidth = toNum(cs.borderWidth);
    out.borderRadius = toNum(cs.borderRadius);
    out.outlineWidth = toNum(cs.outlineWidth);
    out.outlineOffset = toNum(cs.outlineOffset);
    out.padding = toNum(cs.paddingTop);
    out.margin = toNum(cs.marginTop);

    out.lineHeight = toNum(cs.lineHeight);
    out.letterSpacing = toNum(cs.letterSpacing);
    out.fontWeight = toNum(cs.fontWeight);
    out.wordSpacing = toNum(cs.wordSpacing);
    out.textIndent = toNum(cs.textIndent);
    out.textDecorationThickness = toNum(cs.textDecorationThickness);
    out.textUnderlineOffset = toNum(cs.textUnderlineOffset);

    out.gap = toNum(cs.gap);
    out.rowGap = toNum(cs.rowGap);
    out.columnGap = toNum(cs.columnGap);

    out.zIndex = toNum(cs.zIndex);
    out.aspectRatio = toNum(cs.aspectRatio);

    out.backgroundPositionX = toNum(cs.backgroundPositionX);
    out.backgroundPositionY = toNum(cs.backgroundPositionY);
    out.backgroundSizeX = toNum(cs.backgroundSizeX);
    out.backgroundSizeY = toNum(cs.backgroundSizeY);

    out.width = toNum(cs.width);
    out.height = toNum(cs.height);

    const bf = parseFilter(cs.backdropFilter);
    if (Object.keys(bf).length) {
      if (bf.blur != null) out.backdropBlur = bf.blur;
      if (bf.brightness != null) out.backdropBrightness = bf.brightness;
      if (bf.contrast != null) out.backdropContrast = bf.contrast;
      if (bf.saturate != null) out.backdropSaturate = bf.saturate;
      if (bf.opacityFilter != null) out.backdropOpacity = bf.opacityFilter;
    }

    try {
      const p = readXYWHPercent();
      if (p.x != null) out.x = p.x;
      if (p.y != null) out.y = p.y;
      if (p.width != null) out.width = p.width;
      if (p.height != null) out.height = p.height;
    } catch (e) {}

    return out;
  };

  // ======= Hotkeys helpers =======
  const hotkeyValuesRef = useRef({});

  // ====== Props por orientación ======
  const collectPropsByMode = () => {
    const orientIsPortrait = !!wheelCtx?.isPortrait;
    const src =
      (orientIsPortrait
        ? props.portrait || props.p
        : props.landscape || props.l) || null;
    if (!src || typeof src !== "object") return {};
    const out = {};
    for (const k of collectAllModes()) {
      if (Object.prototype.hasOwnProperty.call(src, k)) {
        out[k] = src[k];
      }
    }
    if (src.x != null) out.translateX = src.x;
    if (src.y != null) out.translateY = src.y;
    if (src.width != null) out.width = src.width;
    if (src.height != null) out.height = src.height;
    if (src.fontSize != null) out.font = src.fontSize;
    return out;
  };

  // ====== Resolvers del runtime ======
  const collectRuntimeResolvers = () => {
    const out = {};

    if (typeof resolveBulk === "function") {
      try {
        const bulk = resolveBulk();
        if (bulk && typeof bulk === "object") Object.assign(out, bulk);
      } catch (e) {}
    }

    if (typeof resolveXYWH === "function") {
      try {
        const xywh = resolveXYWH();
        if (xywh && typeof xywh === "object") {
          if (xywh.x != null) out.x = xywh.x;
          if (xywh.y != null) out.y = xywh.y;
          if (xywh.width != null) out.width = xywh.width;
          if (xywh.height != null) out.height = xywh.height;
        }
      } catch (e) {}
    }

    const modes = collectAllModes();
    if (typeof resolveValue === "function") {
      for (const mode of modes) {
        try {
          let v = resolveValue(mode);
          if (v == null) {
            if (mode === "translateX") v = resolveValue("x");
            else if (mode === "translateY") v = resolveValue("y");
            else if (mode === "font") v = resolveValue("fontSize");
          }
          if (v != null) out[mode] = v;
        } catch (e) {}
      }
    }

    if (liveRef?.current && typeof liveRef.current === "object") {
      const l = liveRef.current;
      for (const k in l) {
        if (Object.prototype.hasOwnProperty.call(l, k)) out[k] = l[k];
      }
      if (l.x != null) out.translateX = l.x;
      if (l.y != null) out.translateY = l.y;
      if (l.fontSize != null) out.font = l.fontSize;
    }

    return out;
  };

  const roundIfNumber = (v, dec = 3) =>
    typeof v === "number" ? Number(v.toFixed(dec)) : v;

  // ======= Builders =======
  const buildPortraitDefaultsByMode = () => {
    const out = {};
    for (const mode of collectAllModes()) {
      out[mode] = getDefaultForMode(mode);
    }
    return out;
  };

  const resolersObjHas = (obj, mode) => {
    if (!obj) return false;
    if (Object.prototype.hasOwnProperty.call(obj, mode)) return true;
    if (mode === "translateX" && Object.prototype.hasOwnProperty.call(obj, "x"))
      return true;
    if (mode === "translateY" && Object.prototype.hasOwnProperty.call(obj, "y"))
      return true;
    if (
      mode === "font" &&
      Object.prototype.hasOwnProperty.call(obj, "fontSize")
    )
      return true;
    return false;
  };
  const resolersObjGet = (obj, mode) => {
    if (!obj) return null;
    if (Object.prototype.hasOwnProperty.call(obj, mode)) return obj[mode];
    if (mode === "translateX" && Object.prototype.hasOwnProperty.call(obj, "x"))
      return obj.x;
    if (mode === "translateY" && Object.prototype.hasOwnProperty.call(obj, "y"))
      return obj.y;
    if (
      mode === "font" &&
      Object.prototype.hasOwnProperty.call(obj, "fontSize")
    )
      return obj.fontSize;
    return null;
  };

  const buildPortraitRuntimeByMode = (domByMode, propsBase, resolversObj) => {
    const out = {};
    const modes = collectAllModes();
    const isEnum = (m) =>
      !!(wheelCtx?.ENUM_OPTIONS && wheelCtx.ENUM_OPTIONS[m]);
    for (const mode of modes) {
      let v = null;
      if (isEnum(mode)) {
        v = wheelCtx?.getEnumValue?.(mode);
      } else {
        v = wheelCtx?.getAbsoluteOrNull?.(mode);
        if (v == null && mode === "translateX")
          v = wheelCtx?.getAbsoluteOrNull?.("x");
        if (v == null && mode === "translateY")
          v = wheelCtx?.getAbsoluteOrNull?.("y");
        if (v == null && mode === "width")
          v = wheelCtx?.getAbsoluteOrNull?.("width");
        if (v == null && mode === "height")
          v = wheelCtx?.getAbsoluteOrNull?.("height");
      }
      if (v == null && resolersObjHas(resolversObj, mode))
        v = resolersObjGet(resolversObj, mode);
      if (v == null && propsBase) v = propsBase[mode];
      if (v == null && domByMode) v = domByMode[mode];
      if (v == null) v = getDefaultForMode(mode);
      if (hotkeyValuesRef.current && hotkeyValuesRef.current[mode] != null) {
        v = hotkeyValuesRef.current[mode];
      }
      out[mode] = v;
    }
    return out;
  };

  // ===== Diff helper =====
  const EPS = 1e-6;
  const isEqual = (a, b) => {
    if (typeof a === "number" && typeof b === "number") {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      return Math.abs(a - b) < EPS;
    }
    return a === b;
  };

  // ===== Copiar =====
  const copyDefaults = () => {
    const doCopy = () => {
      try {
        const propsBase = collectPropsByMode();
        const resolversObj = collectRuntimeResolvers();
        const dom = buildPortraitDOMByMode();
        const portrait_defaults = buildPortraitDefaultsByMode();
        const portrait_runtime = buildPortraitRuntimeByMode(
          dom,
          propsBase,
          resolversObj
        );
        const merged = {
          ...portrait_defaults,
          ...propsBase,
          ...resolversObj,
          ...dom,
          ...portrait_runtime,
        };

        let portrait_updated = {};
        Object.keys(merged).forEach((k) => {
          portrait_updated[k] = roundIfNumber(merged[k], 3);
        });

        // OVERRIDE desde liveXY/liveWH (antes del diff)
        let liveXY = null;
        try {
          const raw = localStorage.getItem(id);
          if (raw) liveXY = JSON.parse(raw);
        } catch (e) {}

        const n = (v) => (v == null ? null : Number.isFinite(+v) ? +v : null);
        const lx = n(liveXY?.x);
        const ly = n(liveXY?.y);
        const lw = n(liveWH?.width ?? liveWH?.widht);
        const lh = n(liveWH?.height);
        if (lx != null) {
          portrait_updated.x = +lx;
          portrait_updated.translateX = +lx;
        }
        if (ly != null) {
          portrait_updated.y = +ly;
          portrait_updated.translateY = +ly;
        }
        if (lw != null) portrait_updated.width = +lw;
        if (lh != null) portrait_updated.height = +lh;

        const portrait_diff = {};
        const keys = new Set([
          ...Object.keys(portrait_defaults || {}),
          ...Object.keys(portrait_updated || {}),
        ]);
        keys.forEach((k) => {
          const dv = portrait_defaults[k];
          const uv = portrait_updated[k];
          if (!isEqual(dv, uv)) {
            portrait_diff[k] = roundIfNumber(uv, 3);
          }
        });

        const snap = { portrait_defaults, portrait_updated, portrait_diff };
        const prettyClipboard = JSON.stringify(portrait_diff, null, 2);
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          const session = JSON.parse(sessionStorage.getItem(id));
          const { isPortrait } = wheelCtx;
          console.log(session[isPortrait ? "portrait" : "landscape"])
          const copy=JSON.stringify(session[isPortrait ? "portrait" : "landscape"], null, 2);
          void navigator.clipboard.writeText(copy);
        }

        // Mostrar flash y reclamar TopBar
        setFlashText("copiado");
        if ((isActiveContext || topBarKeyHeld) && !isTopbarOwner())
          claimTopbar();
        if (flashTimerRef.current) {
          try {
            clearTimeout(flashTimerRef.current);
          } catch (e) {}
        }
        flashTimerRef.current = setTimeout(() => setFlashText(null), 900);

        try {
          console.log("[CardDevLayer] Snapshot con diff copiado:", id, snap);
        } catch (e) {}
      } catch (err) {
        try {
          console.error("Error al copiar defaults:", err);
        } catch (e) {}
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(doCopy));
  };

  // ===== Listener global para COPY_EVENT =====
  useEffect(() => {
    if (!isDevMode) return;
    const onRequestCopy = (ev) => {
      const targetId = ev?.detail?.ownerId || null;
      const shouldCopy =
        (targetId && targetId === idRef.current) ||
        (!targetId &&
          (nearRef.current || hoveredRef?.current || focusedRef?.current));
      if (shouldCopy) {
        copyDefaults();
      }
    };
    window.addEventListener(COPY_EVENT, onRequestCopy);
    return () => window.removeEventListener(COPY_EVENT, onRequestCopy);
  }, [isDevMode]);

  // ===== Wheel =====
  const wheelHandlerRef = useRef(null);
  wheelHandlerRef.current = (e) => {
    if (!isDevMode) return;
    if (!isOwner()) return;
    const ctx = wheelCtx || {};
    const modeA = getGlobalMode();
    if (!modeA) return;

    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (e2) {}

    const sampleAfterFrame = () => {
      requestAnimationFrame(() => {
        const resolversObj = collectRuntimeResolvers();
        if (resolersObjHas(resolversObj, modeA)) {
          const val = resolersObjGet(resolversObj, modeA);
          if (val != null) {
            hotkeyValuesRef.current = {
              ...hotkeyValuesRef.current,
              [modeA]: val,
            };
            return;
          }
        }
        const dom = buildPortraitDOMByMode();
        const val = dom[modeA];
        if (val != null) {
          hotkeyValuesRef.current = {
            ...hotkeyValuesRef.current,
            [modeA]: val,
          };
        }
        setTick((t) => t + 1);
      });
    };

    if (ctx.ENUM_OPTIONS && ctx.ENUM_OPTIONS[modeA]) {
      const options = ctx.ENUM_OPTIONS[modeA];
      const dir = e.deltaY < 0 ? +1 : -1;
      const cur = ctx.getEnumValue?.(modeA);
      const idx = Math.max(0, options.indexOf(cur));
      const next = options[(idx + dir + options.length) % options.length];
      ctx.setEnumValue?.(modeA, next);
      hotkeyValuesRef.current = { ...hotkeyValuesRef.current, [modeA]: next };
      setTick((t) => t + 1);
      sampleAfterFrame();
      return;
    }

    const dir = e.deltaY < 0 ? +1 : -1;

    const bump = (name, add, baseDefault, modeName) => {
      (ctx.isPortrait
        ? ctx[`set${name}Portrait`]
        : ctx[`set${name}Landscape`])?.((prev) => {
        const next = (prev ?? 0) + add;
        const abs = baseDefault + next;
        hotkeyValuesRef.current = {
          ...hotkeyValuesRef.current,
          [modeName]: abs,
        };
        return next;
      });
      sampleAfterFrame();
    };

    if (modeA === "font") {
      bump(
        "FontBaseDeltaPct",
        dir * (ctx.fontStepPct ?? 1),
        ctx.defaultPercent?.font ?? getDefaultForMode("font") ?? 0,
        "font"
      );
      return;
    }
    if (modeA === "opacity") {
      bump(
        "OpacityBaseDelta",
        dir * 0.02,
        ctx.defaultPercent?.opacity ?? getDefaultForMode("opacity") ?? 1,
        "opacity"
      );
      return;
    }
    if (modeA === "rotate") {
      bump(
        "RotateBaseDelta",
        dir * 2,
        ctx.defaultPercent?.rotate ?? getDefaultForMode("rotate") ?? 0,
        "rotate"
      );
      return;
    }
    if (modeA === "scale") {
      bump(
        "ScaleBaseDelta",
        dir * 0.1,
        ctx.defaultPercent?.scale ?? getDefaultForMode("scale") ?? 1,
        "scale"
      );
      return;
    }
    if (modeA === "scaleX") {
      bump(
        "ScaleXBaseDelta",
        dir * 0.1,
        ctx.defaultPercent?.scaleX ?? getDefaultForMode("scaleX") ?? 1,
        "scaleX"
      );
      return;
    }
    if (modeA === "scaleY") {
      bump(
        "ScaleYBaseDelta",
        dir * 0.1,
        ctx.defaultPercent?.scaleY ?? getDefaultForMode("scaleY") ?? 1,
        "scaleY"
      );
      return;
    }
    if (modeA === "rotateX") {
      bump(
        "RotateXBaseDelta",
        dir * 2,
        ctx.defaultPercent?.rotateX ?? getDefaultForMode("rotateX") ?? 0,
        "rotateX"
      );
      return;
    }
    if (modeA === "rotateY") {
      bump(
        "RotateYBaseDelta",
        dir * 2,
        ctx.defaultPercent?.rotateY ?? getDefaultForMode("rotateY") ?? 0,
        "rotateY"
      );
      return;
    }

    if (modeA === "blur") {
      const add = dir * 1;
      (ctx.isPortrait
        ? ctx.setBlurBaseDeltaPortrait
        : ctx.setBlurBaseDeltaLandscape)?.((prev) => {
        const next = Math.max(0, (prev ?? 0) + add);
        const base = ctx.defaultPercent?.blur ?? getDefaultForMode("blur") ?? 0;
        hotkeyValuesRef.current = {
          ...hotkeyValuesRef.current,
          blur: Math.max(0, base + next),
        };
        return next;
      });
      sampleAfterFrame();
      return;
    }

    if (modeA === "backdropBlur") {
      const add = dir * 1;
      (ctx.isPortrait
        ? ctx.setBackdropBaseDeltaPortrait
        : ctx.setBackdropBaseDeltaLandscape)?.((prev) => {
        const next = Math.max(0, (prev ?? 0) + add);
        const base =
          ctx.defaultPercent?.backdropBlur ??
          getDefaultForMode("backdropBlur") ??
          0;
        hotkeyValuesRef.current = {
          ...hotkeyValuesRef.current,
          backdropBlur: Math.max(0, base + next),
        };
        return next;
      });
      sampleAfterFrame();
      return;
    }

    const step =
      ctx.WHEEL_STEP && ctx.WHEEL_STEP[modeA] != null
        ? ctx.WHEEL_STEP[modeA]
        : 1;
    const add = dir * step;
    const baseDefault =
      ctx.defaultPercent?.[modeA] ?? getDefaultForMode(modeA) ?? 0;
    const curExtra = ctx.getExtra?.(modeA) ?? 0;
    let next = baseDefault + curExtra + add;
    if (modeA === "hueRotate") {
      next = ((next % 360) + 360) % 360;
      ctx.setExtraExact?.(modeA, next - baseDefault);
    } else {
      const bounds = ctx.BOUNDS && ctx.BOUNDS[modeA];
      if (bounds) next = Math.min(bounds[1], Math.max(bounds[0], next));
      ctx.setExtraExact?.(modeA, next - baseDefault);
    }
    hotkeyValuesRef.current = { ...hotkeyValuesRef.current, [modeA]: next };
    sampleAfterFrame();
  };

  const stableWheelListener = useRef((e) => wheelHandlerRef.current?.(e));
  const attachedOnceRef = useRef(false);
  useEffect(() => {
    if (!isDevMode) return;
    const el = myDiv?.current;
    if (el && !attachedOnceRef.current) {
      el.addEventListener("wheel", stableWheelListener.current, {
        passive: false,
      });
      attachedOnceRef.current = true;
    }
    return () => {
      try {
        el && el.removeEventListener("wheel", stableWheelListener.current);
      } catch (e) {}
      attachedOnceRef.current = false;
    };
  }, [isDevMode, myDiv]);

  /* ================= BUFFER DE 2 LETRAS ================= */
  const COMBO_WINDOW_MS = 500;
  const comboBufferRef = useRef("");
  const comboTimerRef = useRef(null);

  const findModeByAlias = (alias) => {
    if (!alias) return null;
    for (const obj of [COMMAND_BANKS, COMMAND_BANKS_ENUM]) {
      for (const bid of Object.keys(obj || {})) {
        const map = obj[bid] || {};
        if (Object.prototype.hasOwnProperty.call(map, alias)) {
          const raw = map[alias];
          return typeof raw === "string" && raw.startsWith("@")
            ? raw.slice(1)
            : raw;
        }
      }
    }
    return null;
  };

  const toggleMode = (mode) => {
    if (!mode) return;
    const current = getGlobalMode();
    if (current === mode) {
      // NO-OP: mantener activo; solo ESC puede desactivar
      setTopBarKeyHeld(true);
      claimActive();
      claimTopbar();
      setTick((t) => t + 1);
    } else {
      setGlobalMode(mode);
      setTopBarKeyHeld(true);
      // Asegurar dueño inmediato (aunque no haya near/hover)
      claimActive();
      claimTopbar();
      setTick((t) => t + 1);
    }
  };

  const resolveSingleAfterWindow = () => {
    const buf = comboBufferRef.current;
    if (!buf) return;
    const last = buf.slice(-1);
    const m1 = findModeByAlias(last);
    if (m1) toggleMode(m1);
    comboBufferRef.current = "";
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  };

  // === Keyboard: KEYMASTER
  useEffect(() => {
    if (!isDevMode) return;

    // Reclamar ser keymaster si no hay uno
    let iAmKeymaster = false;
    try {
      if (!window[keymasterKey]) {
        window[keymasterKey] = idRef.current;
        iAmKeymaster = true;
      } else {
        iAmKeymaster = window[keymasterKey] === idRef.current;
      }
    } catch (e) {}

    if (!iAmKeymaster) return;

    const onDown = (e) => {
      if (e.repeat) return;
      const kRaw = e.key || "";
      const k = kRaw.length === 1 ? kRaw.toLowerCase() : kRaw.toLowerCase();

      // "2" copiar
      if (k === "2") {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (e2) {}
        const currentOwner = window[ownerKey] || null;
        const ev = new CustomEvent(COPY_EVENT, {
          detail: { ownerId: currentOwner },
        });
        window.dispatchEvent(ev);
        return;
      }

      if (k === "escape") {
        try {
          e.preventDefault();
        } catch (e2) {}
        setShowHelp(false);
        setShowBlack(false);
        setTopBarKeyHeld(false);
        setGlobalMode(null);
        comboBufferRef.current = "";
        if (comboTimerRef.current) {
          clearTimeout(comboTimerRef.current);
          comboTimerRef.current = null;
        }
        if (!isActiveContext && isTopbarOwner()) releaseTopbarIfOwner();
        return;
      }

      if (k >= "1" && k <= "9") {
        try {
          e.preventDefault();
        } catch (e2) {}
        if (showBlack) {
          setActiveGroup(Number(k));
        } else if (k === "1") {
          setShowBlack(true);
          setActiveGroup(1);
          setBlackLabel && setBlackLabel("");
        }
        return;
      }

      // Letras (1 o 2)
      if (/^[a-z]$/.test(k)) {
        try {
          e.preventDefault();
        } catch (e2) {}

        const nextBuf = (comboBufferRef.current + k).slice(-2);
        comboBufferRef.current = nextBuf;

        if (nextBuf.length === 2) {
          const m2 = findModeByAlias(nextBuf);
          if (m2) {
            toggleMode(m2);
            comboBufferRef.current = "";
            if (comboTimerRef.current) {
              clearTimeout(comboTimerRef.current);
              comboTimerRef.current = null;
            }
            return;
          } else {
            comboBufferRef.current = nextBuf.slice(-1);
            if (comboTimerRef.current) {
              clearTimeout(comboTimerRef.current);
            }
            comboTimerRef.current = setTimeout(
              resolveSingleAfterWindow,
              COMBO_WINDOW_MS
            );
            return;
          }
        }

        if (nextBuf.length === 1) {
          if (comboTimerRef.current) {
            clearTimeout(comboTimerRef.current);
          }
          comboTimerRef.current = setTimeout(
            resolveSingleAfterWindow,
            COMBO_WINDOW_MS
          );
        }

        return;
      }
    };

    const onUp = (_e) => {};

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      try {
        if (window[keymasterKey] === idRef.current) window[keymasterKey] = null;
      } catch {}
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = null;
      }
      comboBufferRef.current = "";
    };
  }, [
    isDevMode,
    showBlack,
    setTopBarKeyHeld,
    setShowBlack,
    setActiveGroup,
    setBlackLabel,
    setShowHelp,
    isActiveContext,
  ]);

  // Guías
  useEffect(() => {
    if (!isDevMode) return;
    if (guide !== "active" && guide !== "auto") return;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      if (myDiv?.current) {
        try {
          const mid = computeGuideMidlines(myDiv.current);
          setGuideMid(mid);
        } catch (e) {}
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const onWindowChange = () => {
      if (myDiv?.current) {
        try {
          setGuideMid(computeGuideMidlines(myDiv.current));
        } catch (e) {}
      }
    };
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, { passive: true });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange);
    };
  }, [isDevMode, guide, myDiv, computeGuideMidlines, setGuideMid]);

  const portalContainer = isDevMode ? ensureTopbarContainer() : null;
  const topbarMode = getGlobalMode();
  // Visibilidad del TopBar: contexto activo O tecla de modo presionada
  const shouldShowTopbarSingleton =
    isDevMode &&
    !!portalContainer &&
    (isActiveContext || topBarKeyHeld) &&
    isTopbarOwner() &&
    (!!topbarMode || !!flashText);

  // HUD
  const hud = (() => {
    const m = topbarMode;
    if (!m) return { alias: "", label: "" };
    const labels = COMMAND_LABELS_BANKS[activeGroup] || {};
    let alias = null;
    for (const obj of [COMMAND_BANKS, COMMAND_BANKS_ENUM]) {
      const map = (obj && obj[activeGroup]) || {};
      for (const [a, raw] of Object.entries(map)) {
        const mm =
          typeof raw === "string" && raw.startsWith("@") ? raw.slice(1) : raw;
        if (mm === m) {
          alias = a;
          break;
        }
      }
      if (alias) break;
    }
    const label = (alias ? labels[alias] : null) || m;
    return { alias, label, name: m };
  })();

  // Valor (enum o num)
  let liveValueWhenOwner = null;
  if (topbarMode && isTopbarOwner()) {
    const isEnum = !!(
      wheelCtx?.ENUM_OPTIONS && wheelCtx.ENUM_OPTIONS[topbarMode]
    );
    liveValueWhenOwner = isEnum
      ? wheelCtx?.getEnumValue?.(topbarMode)
      : resolveValue?.(topbarMode) ?? wheelCtx?.getAbsoluteOrNull?.(topbarMode);
  }
  const valueForTopBar =
    flashText != null ? flashText : liveValueWhenOwner ?? "";

  useEffect(
    () => () => {
      try {
        clearTimeout(flashTimerRef.current);
      } catch (e) {}
    },
    []
  );

  useEffect(() => {
    if (liveValueWhenOwner) {
      let session = JSON.parse(sessionStorage.getItem(id));
      const { isPortrait } = wheelCtx;

      session[isPortrait ? "portrait" : "landscape"] = {
        ...session[isPortrait ? "portrait" : "landscape"],
        [hud.name]: liveValueWhenOwner,
      };
      sessionStorage.setItem(id, JSON.stringify(session));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueForTopBar]);

  return (
    <>
      <GuideCards
        showTopBar={false}
        showMidlines={isDevMode && guide !== "inactive" && !!guideMid}
        guideMid={guideMid}
        colorGuide={colorGuide}
      />

      <Command
        visible={isDevMode && showBlack}
        activeGroup={activeGroup}
        onRequestClose={() => setShowBlack(false)}
      />

      {shouldShowTopbarSingleton &&
        createPortal(
          <DevTopBar
            show={true}
            label={flashText ? "copiado" : hud ? hud.label : ""}
            alias={hud ? hud.alias : ""}
            value={valueForTopBar}
          />,
          portalContainer
        )}

      {isDevMode && showHelp && legendDisplayText ? <div /> : null}
    </>
  );
}
