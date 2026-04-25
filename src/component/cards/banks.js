// src/component/cards/banks.js
// === Bancos/Enums/Constantes centralizadas ===

/* ===========================
   Defaults (heredan portrait/landscape)
=========================== */
export const defaultPercent = {
  width: 10,
  height: 10,
  x: 0,
  y: 0,
  anchor: "left-top",
  fontSize: 10,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  // NUEVOS (B1)
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  perspective: 800,
  hidden: false,
  blur: 0,
  backdropBlur: 0,
  transformOrigin: "center center",

  // numéricas nuevas
  zIndex: 0,
  skewX: 0,
  skewY: 0,
  lineHeight: 1.2,
  letterSpacing: 0,
  fontWeight: 400,
  // tipografía extra (B5 opcionales)
  wordSpacing: 0,
  textIndent: 0,
  textDecorationThickness: 0,
  textUnderlineOffset: 0,
  textStrokeWidth: 0,

  // filtros (B2)
  brightness: 1,
  contrast: 1,
  saturate: 1,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hueRotate: 0,
  opacityFilter: 1,
  // drop-shadow (componentes numéricos)
  dropShadowOffsetX: 0,
  dropShadowOffsetY: 0,
  dropShadowBlur: 0,
  dropShadowSpread: 0, // no estándar en filter; se ignora

  // backdrop (B3)
  backdropBrightness: 1,
  backdropContrast: 1,
  backdropSaturate: 1,
  backdropOpacity: 1,

  // bordes/caja (B4)
  borderWidth: 0,
  borderRadius: 0,
  outlineWidth: 0,
  outlineOffset: 0,
  padding: 0,
  margin: 0,
  aspectRatio: 0,
  // box-shadow por partes
  boxShadowOffsetX: 0,
  boxShadowOffsetY: 0,
  boxShadowBlur: 0,
  boxShadowSpread: 0,

  // background por ejes (B6)
  backgroundPositionX: 50,
  backgroundPositionY: 50,
  backgroundSizeX: 100,
  backgroundSizeY: 100,

  // layout (B8)
  gap: 0,
  rowGap: 0,
  columnGap: 0,
};

// === Guía
export const GUIDE_OPACITY = 0.8;

/* ===========================
   ENUMS: opciones y defaults
=========================== */
export const ENUM_OPTIONS = {
  // Banco 1
  transformOriginPreset: ["center center","left top","left center","left bottom","center top","center bottom","right top","right center","right bottom"],
  perspectiveOrigin: ["center center","left top","left center","left bottom","center top","center bottom","right top","right center","right bottom"],
  transformStyle: ["preserve-3d","flat"],
  backfaceVisibility: ["visible","hidden"],
  transformBox: ["border-box","content-box","fill-box"],

  // Banco 4
  borderStyle: ["none","hidden","solid","dashed","dotted","double","groove","ridge","inset","outset"],
  outlineStyle: ["none","solid","dashed","dotted","double","groove","ridge","inset","outset"],
  boxDecorationBreak: ["slice","clone"],

  // Banco 5
  fontKerning: ["auto","normal","none"],
  fontVariantCaps: ["normal","small-caps","all-small-caps","petite-caps","all-petite-caps","unicase","titling-caps"],
  fontVariantLigatures: ["normal","none"],
  fontSynthesis: ["weight","style","small-caps","position","none"],

  // Banco 6
  backgroundSize: ["cover","contain","auto"],
  backgroundRepeat: ["no-repeat","repeat","repeat-x","repeat-y","space","round"],
  backgroundPositionPreset: ["center center","top left","top center","top right","center left","center right","bottom left","bottom center","bottom right"],
  backgroundClip: ["border-box","padding-box","content-box","text"],
  backgroundOrigin: ["padding-box","border-box","content-box"],
  backgroundBlendMode: ["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],
  backgroundAttachment: ["scroll","fixed","local"],

  // Banco 7
  mixBlendMode: ["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],
  isolation: ["auto","isolate"],

  // Banco 8
  overflow: ["visible","hidden","clip","scroll","auto"],
  overscrollBehavior: ["auto","contain","none"],
  pointerEvents: ["auto","none"],
  boxSizing: ["content-box","border-box"],
  cursor: ["auto","default","pointer","grab","grabbing","move","crosshair","text","not-allowed"],
  display: ["block","inline","inline-block","flex","grid","contents","none"],
  contain: ["none","layout","paint","style","content","strict","size","inline-size"],

  // Banco 9
  textAlign: ["start","left","center","right","end","justify"],
  textTransform: ["none","capitalize","uppercase","lowercase"],
  textDecorationLine: ["none","underline","overline","line-through"],
  textDecorationStyle: ["solid","double","dotted","dashed","wavy"],
  whiteSpace: ["normal","nowrap","pre","pre-wrap","pre-line","break-spaces"],
  wordBreak: ["normal","break-all","keep-all","break-word"],
  hyphens: ["manual","none","auto"],
  textOverflow: ["clip","ellipsis"],
  direction: ["ltr","rtl"],
  writingMode: ["horizontal-tb","vertical-rl","vertical-lr"],
  textWrap: ["wrap","nowrap","balance","pretty"],
  textRendering: ["auto","optimizeSpeed","optimizeLegibility","geometricPrecision"],
};

export const ENUM_DEFAULTS = {
  // Banco 1
  transformOriginPreset: "center center",
  perspectiveOrigin: "center center",
  transformStyle: "preserve-3d",
  backfaceVisibility: "visible",
  transformBox: "border-box",

  // Banco 4
  borderStyle: "solid",
  outlineStyle: "none",
  boxDecorationBreak: "slice",

  // Banco 5
  fontKerning: "auto",
  fontVariantCaps: "normal",
  fontVariantLigatures: "normal",
  fontSynthesis: "weight style",

  // Banco 6
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPositionPreset: "center center",
  backgroundClip: "border-box",
  backgroundOrigin: "padding-box",
  backgroundBlendMode: "normal",
  backgroundAttachment: "scroll",

  // Banco 7
  mixBlendMode: "normal",
  isolation: "auto",

  // Banco 8
  overflow: "visible",
  overscrollBehavior: "auto",
  pointerEvents: "auto",
  boxSizing: "content-box",
  cursor: "auto",
  display: "flex",
  contain: "contain",

  // Banco 9
  textAlign: "center",
  textTransform: "none",
  textDecorationLine: "none",
  textDecorationStyle: "solid",
  whiteSpace: "normal",
  wordBreak: "normal",
  hyphens: "manual",
  textOverflow: "clip",
  direction: "ltr",
  writingMode: "horizontal-tb",
  textWrap: "wrap",
  textRendering: "auto",
};

/* ===========================
   HOTKEY BANKS — SOLO NUM y ENUM
   Soporta alias de 1 y 2 letras.
=========================== */
export const COMMAND_BANKS = {
  // NUM
  1: { f:"font", s:"scale", x:"scaleX", y:"scaleY", z:"scaleZ", r:"rotate", t:"rotateX", u:"rotateY", q:"translateX", w:"translateY", e:"translateZ", k:"skewX", l:"skewY", p:"perspective" },
  2: { o:"opacity", b:"blur", a:"brightness", c:"contrast", sa:"saturate", g:"grayscale", h:"sepia", i:"invert", j:"hueRotate", v:"opacityFilter",
       dx:"dropShadowOffsetX", dy:"dropShadowOffsetY", db:"dropShadowBlur", ds:"dropShadowSpread" },
  3: { pb:"backdropBlur", wb:"backdropBrightness", zc:"backdropContrast", ms:"backdropSaturate", qo:"backdropOpacity" },
  4: { d:"borderWidth", n:"borderRadius", ow:"outlineWidth", oo:"outlineOffset", pa:"padding", ma:"margin", zi:"zIndex", ar:"aspectRatio",
       sx:"boxShadowOffsetX", sy:"boxShadowOffsetY", sb:"boxShadowBlur", ss:"boxShadowSpread" },
  5: { fz:"font", lh:"lineHeight", ls:"letterSpacing", fw:"fontWeight", ws:"wordSpacing", ti:"textIndent", dt:"textDecorationThickness", uo:"textUnderlineOffset", sw:"textStrokeWidth" },
  6: { px:"backgroundPositionX", py:"backgroundPositionY", bx:"backgroundSizeX", by:"backgroundSizeY" },
  7: { }, // sin num extra
  8: { ga:"gap", gr:"rowGap", gc:"columnGap" },
  9: { }, // sin num extra
};

// ENUMS (prefijo @ para distinguir internamente)
export const COMMAND_BANKS_ENUM = {
  1: { to:"@transformOriginPreset", po:"@perspectiveOrigin", ts:"@transformStyle", bf:"@backfaceVisibility", tb:"@transformBox" },
  2: { },
  3: { },
  4: { bs:"@borderStyle", os:"@outlineStyle", bd:"@boxDecorationBreak" },
  5: { fk:"@fontKerning", fc:"@fontVariantCaps", fl:"@fontVariantLigatures", fs:"@fontSynthesis" },
  6: { sz:"@backgroundSize", br:"@backgroundRepeat", bp:"@backgroundPositionPreset", bc:"@backgroundClip", bo:"@backgroundOrigin", bb:"@backgroundBlendMode", ba:"@backgroundAttachment" },
  7: { mb:"@mixBlendMode", is:"@isolation" },
  8: { ov:"@overflow", ob:"@overscrollBehavior", pe:"@pointerEvents", bz:"@boxSizing", cu:"@cursor", di:"@display", ct:"@contain" },
  9: { ta:"@textAlign", tt:"@textTransform", dl:"@textDecorationLine", ds:"@textDecorationStyle", wh:"@whiteSpace", wr:"@wordBreak", hy:"@hyphens", xo:"@textOverflow", dr:"@direction", wm:"@writingMode", tw:"@textWrap", tr:"@textRendering" },
};

// Etiquetas visibles en el overlay
export const COMMAND_LABELS_BANKS = {
  1: { f:"Font size", s:"Scale", x:"Scale X", y:"Scale Y", z:"Scale Z", r:"Rotate Z", t:"Rotate X", u:"Rotate Y", q:"Translate X", w:"Translate Y", e:"Translate Z", k:"Skew X", l:"Skew Y", p:"Perspective",
       to:"Transform Origin", po:"Perspective Origin", ts:"Transform Style", bf:"Backface Visibility", tb:"Transform Box" },
  2: { o:"Opacity", b:"Blur", a:"Brightness", c:"Contrast", sa:"Saturate", g:"Grayscale", h:"Sepia", i:"Invert", j:"Hue Rotate", v:"Opacity (filter)",
       dx:"DropShadow X", dy:"DropShadow Y", db:"DropShadow Blur", ds:"DropShadow Spread" },
  3: { pb:"Backdrop Blur", wb:"Backdrop Brightness", zc:"Backdrop Contrast", ms:"Backdrop Saturate", qo:"Backdrop Opacity" },
  4: { d:"Border Width", n:"Border Radius", ow:"Outline Width", oo:"Outline Offset", pa:"Padding", ma:"Margin", zi:"Z-Index", ar:"Aspect Ratio", sx:"BoxShadow X", sy:"BoxShadow Y", sb:"BoxShadow Blur", ss:"BoxShadow Spread",
       bs:"Border Style", os:"Outline Style", bd:"Box Decoration Break" },
  5: { fz:"Font size", lh:"Line Height", ls:"Letter Spacing", fw:"Font Weight", ws:"Word Spacing", ti:"Text Indent", dt:"Text Decoration Thickness", uo:"Underline Offset", sw:"Text Stroke Width",
       fk:"Font Kerning", fc:"Variant Caps", fl:"Ligatures", fs:"Font Synthesis" },
  6: { px:"BG Position X", py:"BG Position Y", bx:"BG Size X", by:"BG Size Y",
       sz:"Background Size", br:"Background Repeat", bp:"Background Position", bc:"Background Clip", bo:"Background Origin", bb:"Background Blend Mode", ba:"Background Attachment" },
  7: { mb:"Mix-Blend Mode", is:"Isolation" },
  8: { ga:"Gap", gr:"Row Gap", gc:"Column Gap", ov:"Overflow", ob:"Overscroll", pe:"Pointer Events", bz:"Box Sizing", cu:"Cursor", di:"Display", ct:"Contain" },
  9: { ta:"Text Align", tt:"Text Transform", dl:"Decoration Line", ds:"Decoration Style", wh:"White Space", wr:"Word Break", hy:"Hyphens", xo:"Text Overflow", dr:"Direction", wm:"Writing Mode", tw:"Text Wrap", tr:"Text Rendering" },
};

export const BANK_TITLES = {
  1: "transform / tamaño de fuente",
  2: "filtros del elemento",
  3: "backdrop-filter",
  4: "bordes / caja",
  5: "tipografía",
  6: "background",
  7: "3D / mezcla",
  8: "layout / puntero",
  9: "texto",
};

// Límites y pasos para numéricos
export const WHEEL_STEP = {
  brightness: 0.05, contrast: 0.05, saturate: 0.05,
  grayscale: 0.05, sepia: 0.05, invert: 0.05,
  hueRotate: 5, opacityFilter: 0.05,
  backdropBrightness: 0.05, backdropContrast: 0.05, backdropSaturate: 0.05, backdropOpacity: 0.05,
  skewX: 2, skewY: 2,
  borderWidth: 1, borderRadius: 1, outlineWidth: 1, outlineOffset: 1,
  padding: 2, margin: 2,
  lineHeight: 0.05, letterSpacing: 0.5, fontWeight: 50,
  zIndex: 1, aspectRatio: 0.05,
  // extra comunes
  gap: 2, rowGap: 2, columnGap: 2,
  backgroundPositionX: 1, backgroundPositionY: 1,
  backgroundSizeX: 1, backgroundSizeY: 1,
  wordSpacing: 0.5, textIndent: 2, textDecorationThickness: 1, textUnderlineOffset: 1, textStrokeWidth: 1,
};

export const BOUNDS = {
  brightness: [0, 5], contrast: [0, 5], saturate: [0, 5],
  grayscale: [0, 1], sepia: [0, 1], invert: [0, 1],
  hueRotate: [0, 360], opacityFilter: [0, 1],
  backdropBrightness: [0, 5], backdropContrast: [0, 5], backdropSaturate: [0, 5], backdropOpacity: [0, 1],
  skewX: [-89, 89], skewY: [-89, 89],
  borderWidth: [0, 200], borderRadius: [-100, 100], outlineWidth: [0, 200], outlineOffset: [0, 200],
  padding: [0, 400], margin: [-400, 400],
  lineHeight: [0.5, 3], letterSpacing: [-10, 50], fontWeight: [100, 900],
  zIndex: [-9999, 9999], aspectRatio: [0, 5],
  gap: [0, 400], rowGap: [0, 400], columnGap: [0, 400],
  backgroundPositionX: [-1000, 1000], backgroundPositionY: [-1000, 1000],
  backgroundSizeX: [0, 1000], backgroundSizeY: [0, 1000],
  wordSpacing: [-10, 50], textIndent: [-400, 400],
  textDecorationThickness: [0, 20], textUnderlineOffset: [0, 40], textStrokeWidth: [0, 20],
};
