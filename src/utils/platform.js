// platform.js
export function detectPlatform() {
    if (typeof navigator === "undefined") return "escritorio";
  
    const ua = navigator.userAgent || "";
    const uaLC = ua.toLowerCase();
  
    // 1) Android
    if (uaLC.includes("android")) return "android";
  
    // 2) iOS / iPadOS (incluye iPadOS 13+ que a veces se hace pasar por Mac)
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reporta "MacIntel" pero con soporte táctil
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  
    if (isIOS) return "ios";
  
    // 3) Escritorio por defecto
    return "escritorio";
  }
  