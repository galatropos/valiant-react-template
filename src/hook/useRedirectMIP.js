// useRedirectMIP.js
import { useEffect, useRef } from "react";
import { registerOpenOnClick } from "../utils/registerOpenOnClick";
 
/* ================= Helpers de locale/plataforma ================= */
function readPrimaryLocale() {
  if (typeof navigator === "undefined") return "en-US";
  const arr = (Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  ).filter(Boolean);
  return String(arr[0] || "en-US").replace("_", "-"); // e.g. "es-MX"
}

function toHL(locale) {
  const [lang = "en", region] = String(locale).split("-");
  return region ? `${lang.toLowerCase()}_${region.toUpperCase()}` : lang.toLowerCase();
}

function toAppleLang(locale) {
  const [lang = "en", region] = String(locale).split("-");
  return region ? `${lang.toLowerCase()}-${region.toUpperCase()}` : lang.toLowerCase();
}

function isGooglePlayUrl(url) {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://x/");
    return u.hostname.includes("play.google.com") && u.pathname.startsWith("/store/apps/details");
  } catch {
    return /\/\/play\.google\.com\/store\/apps\/details/.test(url);
  }
}

function isAppleAppUrl(url) {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://x/");
    return u.hostname.includes("apps.apple.com") && /\/app\//.test(u.pathname);
  } catch {
    return /\/\/apps\.apple\.com\/.+\/app\//.test(url);
  }
}

function withQueryParam(url, key, value) {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://x/");
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const hasQ = url.includes("?");
    const re = new RegExp(`([?&])${key}=[^&]*`);
    if (re.test(url)) return url.replace(re, `$1${key}=${encodeURIComponent(value)}`);
    return url + (hasQ ? "&" : "?") + `${key}=${encodeURIComponent(value)}`;
  }
}

function rewriteAppleStorefront(url, storefront) {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://x/");
    if (!u.hostname.includes("apps.apple.com")) return url;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      if (/^[a-z]{2}$/i.test(parts[0])) parts[0] = storefront.toLowerCase();
      else parts.unshift(storefront.toLowerCase());
      u.pathname = "/" + parts.join("/");
      return u.toString();
    }
    return url;
  } catch {
    if (/\/\/apps\.apple\.com\/[a-z]{2}\//i.test(url)) {
      return url.replace(/(\/\/apps\.apple\.com\/)[a-z]{2}\//i, `$1${storefront.toLowerCase()}/`);
    }
    return url.replace(/(\/\/apps\.apple\.com\/)/i, `$1${storefront.toLowerCase()}/`);
  }
}

function detectTargetKey() {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent || "";
  const lc = ua.toLowerCase();
  const vendor = navigator.vendor || "";
  const isTouch =
    ("ontouchstart" in (typeof window !== "undefined" ? window : {})) ||
    (navigator.maxTouchPoints || 0) > 0 ||
    (navigator.msMaxTouchPoints || 0) > 0;

  // Android → Play Store
  if (lc.includes("android")) return "playStore";

  // iOS/iPadOS/macOS → App Store
  const uaSaysIOS = /iPad|iPhone|iPod/.test(ua);
  const macLikeWithTouch = /Macintosh/.test(ua) && isTouch; // iPadOS con UA tipo Mac
  const isAppleVendor = /Apple/i.test(vendor);
  const isMacOS = /Macintosh|Mac OS X|Mac OS/i.test(ua);

  if (uaSaysIOS || macLikeWithTouch || (isAppleVendor && (isTouch || isMacOS))) {
    return "appstore";
  }
  // Default → windows
  return "windows";
}

/* ============== Core: resolver URL final ============== */
function resolveRedirectUrl(
  urlOrMap,
  { fallback, addAndroidHL = true, addIOSLanguage = true, forceIOSStorefront = false, platformOverride } = {}
) {
  let key = null;
  let resolvedUrl = null;

  if (typeof urlOrMap === "string") {
    resolvedUrl = urlOrMap;
  } else if (urlOrMap && typeof urlOrMap === "object") {
    key = platformOverride || detectTargetKey(); // "playStore" | "appstore" | "windows"
    resolvedUrl = urlOrMap[key] ?? fallback ?? null;
  }
  if (!resolvedUrl) return null;

  const locale = readPrimaryLocale(); // "es-MX"
  const [, regionRaw] = locale.split("-");
  const region = regionRaw?.toUpperCase();

  // Play Store → hl=es_MX
  if (addAndroidHL && (key ?? detectTargetKey()) === "playStore" && isGooglePlayUrl(resolvedUrl)) {
    resolvedUrl = withQueryParam(resolvedUrl, "hl", toHL(locale));
  }
  // App Store → l=es-MX (+ opcional storefront /mx/)
  if ((key ?? detectTargetKey()) === "appstore" && isAppleAppUrl(resolvedUrl)) {
    if (addIOSLanguage) {
      resolvedUrl = withQueryParam(resolvedUrl, "l", toAppleLang(locale));
    }
    if (forceIOSStorefront && region && /^[A-Z]{2}$/.test(region)) {
      resolvedUrl = rewriteAppleStorefront(resolvedUrl, region.toLowerCase());
    }
  }

  return resolvedUrl;
}

function jumpTo(url, target = "_blank", delay = 0) {
  const nav = () => {
    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(url);
    }
  };
  if (delay > 0) setTimeout(nav, delay);
  else nav();
}

/* =========================================================
   1) AUTOMÁTICO — HOOK (se suscribe “afuera”)
   - Por defecto hacía 1 sola vez; ahora puedes controlar con `once` y `cooldownMs`.
   ========================================================= */
export default function useRedirectMIP(
  urlOrMap,
  {
    target = "_blank",
    delay = 0,
    events = ["pointerdown", "touchstart", "click", "keydown"],
    scope,
    condition = () => true,
    fallback,
    addAndroidHL = true,
    addIOSLanguage = true,
    forceIOSStorefront = false,
    platformOverride,
    // control de frecuencia:
    once = true,     // true: una sola vez; false: múltiples veces
    cooldownMs = 0,  // si once=false, aplica antirebote entre disparos
  } = {}
) {
  const firedRef = useRef(false);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const tgt = scope ?? (typeof window !== "undefined" ? window : undefined);
    if (!tgt?.addEventListener || !urlOrMap) return;

    const cleanups = [];

    const go = (e) => {
      if (condition?.(e) === false) return;

      if (once) {
        if (firedRef.current) return;
      } else if (cooldownMs > 0) {
        const now = Date.now();
        if (now - lastTsRef.current < cooldownMs) return;
        lastTsRef.current = now;
      }

      const url = resolveRedirectUrl(urlOrMap, {
        fallback,
        addAndroidHL,
        addIOSLanguage,
        forceIOSStorefront,
        platformOverride,
      });
      if (!url) return;

      if (once) firedRef.current = true;
      jumpTo(url, target, delay);

      if (once) {
        // desenchufa todos los listeners al primer disparo (modo una-vez)
        cleanups.forEach((fn) => fn());
        cleanups.length = 0;
      }
    };

    // `opts.once` sigue la opción once (optimiza en modo una-vez)
    const opts = { capture: true, passive: true, once };
    for (const ev of events) {
      tgt.addEventListener(ev, go, opts);
      cleanups.push(() => tgt.removeEventListener(ev, go, opts));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [
    typeof urlOrMap === "string" ? urlOrMap : urlOrMap?.playStore,
    typeof urlOrMap === "string" ? null : urlOrMap?.appstore,
    typeof urlOrMap === "string" ? null : urlOrMap?.windows,
    target,
    delay,
    Array.isArray(events) ? events.join("|") : "",
    scope,
    condition,
    fallback,
    addAndroidHL,
    addIOSLanguage,
    forceIOSStorefront,
    platformOverride,
    once,
    cooldownMs,
  ]);
}

/* =========================================================
   2) EVENTO — FUNCIÓN (llamar “adentro” del handler)
   - Llámala en onClick/onTouch/etc. Se puede invocar N veces.
   ========================================================= */
export function useRedirectMIPEvent(
  urlOrMap,
  {
    target = "_blank",
    delay = 0,
    condition = () => true,
    fallback,
    addAndroidHL = true,
    addIOSLanguage = true,
    forceIOSStorefront = false,
    platformOverride,
  } = {}
) {
  if (typeof window === "undefined") return;
  if (condition?.() === false) return;

  const url = resolveRedirectUrl(urlOrMap, {
    fallback,
    addAndroidHL,
    addIOSLanguage,
    forceIOSStorefront,
    platformOverride,
  });
  if (!url) return;

  // Se ejecuta en el gesto del usuario → sin bloqueos de popup
    
  registerOpenOnClick();
  setTimeout(()=>{
    jumpTo(url, target, delay);
  },100) 
}

/* Azúcar opcional: creador de handler listo para pasar directo a onClick */
export function createRedirectMIPEvent(urlOrMap, options) {
  return () => useRedirectMIPEvent(urlOrMap, options);
}
