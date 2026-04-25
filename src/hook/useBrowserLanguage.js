// useBrowserLanguage.js
import { useEffect, useState } from "react";

function readLocales() {
  if (typeof navigator === "undefined") return [];
  const arr = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language].filter(Boolean);
  return arr.map(l => String(l).replace("_","-"));
}

export default function useBrowserLanguage() {
  const [locales, setLocales] = useState(() => readLocales());

  useEffect(() => {
    const onChange = () => setLocales(readLocales());
    window.addEventListener("languagechange", onChange);
    return () => window.removeEventListener("languagechange", onChange);
  }, []);

  const primary = locales[0] ?? "en-US";
  // Descompone: es-MX → lang="es", region="MX"
  const [lang, region] = primary.split("-");
  return { locales, primary, lang: (lang||"en").toLowerCase(), region: region?.toUpperCase() };
}
