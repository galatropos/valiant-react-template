import { useEffect } from "react";

const guessFormat = (url = "") => {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  return undefined;
};

const toArray = (v) =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const FontChange = ({ fontUrl = [], fonFamily = [], fontFamily }) => {
  // Normaliza: admite string o array
  const urls = toArray(fontUrl);
  const familiesRaw = toArray(
    Array.isArray(fontFamily) || typeof fontFamily === "string"
      ? fontFamily
      : fonFamily
  );

  useEffect(() => {
    const count = Math.min(urls.length, familiesRaw.length);
    if (count === 0) return;

    const STYLE_ID = "dynamic-fonts-style";
    let styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();

    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;

    let css = "";

    for (let i = 0; i < count; i++) {
      const url = urls[i];
      const fam = familiesRaw[i];
      if (!url || !fam) continue;

      const fmt = guessFormat(url);
      const src = fmt ? `url('${url}') format('${fmt}')` : `url('${url}')`;

      css += `
@font-face{
  font-family:'${fam}';
  src:${src};
  font-weight:100 900;
  font-style:normal;
  font-display:swap;
}
`;
    }

    // Aplica la familia [0] SOLO al body con !important
    if (familiesRaw[0]) {
      css += `
body{
  font-family:'${familiesRaw[0]}', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
}
`;
    }

    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, [urls, familiesRaw]);

  return null;
};

export default FontChange;
