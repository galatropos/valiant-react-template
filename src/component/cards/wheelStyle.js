// src/component/cards/wheelStyle.js
/**
 * buildStyleFromWheel(ctx)
 * Convierte los valores del wheelCtx en un objeto `style` de React.
 * - Compone transform (translate, rotate, skew, scale, perspective)
 * - Compone filter y backdropFilter
 * - Aplica propiedades métricas (borders, padding/margin, etc.)
 * - Aplica tipografía y background
 *
 * Nota: Este builder asume que estás renderizando en un wrapper que recibe `style`.
 */
export function buildStyleFromWheel(ctx) {
  const d = ctx.defaultPercent;
  const gx = (m) => (d?.[m] ?? 0) + (ctx.getExtra?.(m) ?? 0);
  const clamp = (v, b) => (b ? Math.min(b[1], Math.max(b[0], v)) : v);

  // ===== Transform =====
  const t = [];
  const perspective = clamp(gx("perspective"), ctx.BOUNDS?.perspective);
  if (perspective) t.push(`perspective(${perspective}px)`);

  const tx = clamp(gx("translateX"), ctx.BOUNDS?.translateX);
  const ty = clamp(gx("translateY"), ctx.BOUNDS?.translateY);
  const tz = clamp(gx("translateZ"), ctx.BOUNDS?.translateZ);
  if (tx) t.push(`translateX(${tx}px)`);
  if (ty) t.push(`translateY(${ty}px)`);
  if (tz) t.push(`translateZ(${tz}px)`);

  // explicit rotate/scale del ctx (portrait-aware)
  const rot = (ctx.isPortrait ? ctx.rotateBaseDeltaPortrait : ctx.rotateBaseDeltaLandscape) ?? 0;
  const rotX = (ctx.isPortrait ? ctx.rotateXBaseDeltaPortrait : ctx.rotateXBaseDeltaLandscape) ?? 0;
  const rotY = (ctx.isPortrait ? ctx.rotateYBaseDeltaPortrait : ctx.rotateYBaseDeltaLandscape) ?? 0;
  if (rot) t.push(`rotate(${rot}deg)`);
  if (rotX) t.push(`rotateX(${rotX}deg)`);
  if (rotY) t.push(`rotateY(${rotY}deg)`);

  const sc = 1 + ((ctx.isPortrait ? ctx.scaleBaseDeltaPortrait : ctx.scaleBaseDeltaLandscape) ?? 0);
  const scx = 1 + ((ctx.isPortrait ? ctx.scaleXBaseDeltaPortrait : ctx.scaleXBaseDeltaLandscape) ?? 0);
  const scy = 1 + ((ctx.isPortrait ? ctx.scaleYBaseDeltaPortrait : ctx.scaleYBaseDeltaLandscape) ?? 0);
  // apply separate axes only if they differ from base scale
  if (sc !== 1) t.push(`scale(${sc})`);
  if (scx !== 1) t.push(`scaleX(${scx})`);
  if (scy !== 1) t.push(`scaleY(${scy})`);

  const skewX = clamp(gx("skewX"), ctx.BOUNDS?.skewX);
  const skewY = clamp(gx("skewY"), ctx.BOUNDS?.skewY);
  if (skewX) t.push(`skewX(${skewX}deg)`);
  if (skewY) t.push(`skewY(${skewY}deg)`);

  const transform = t.join(" ") || undefined;

  // ===== Filter =====
  const F = [];
  const blur = (ctx.isPortrait ? ctx.blurBaseDeltaPortrait : ctx.blurBaseDeltaLandscape) ?? 0;
  if (blur) F.push(`blur(${blur}px)`);

  const brightness = clamp(gx("brightness"), ctx.BOUNDS?.brightness);
  const contrast = clamp(gx("contrast"), ctx.BOUNDS?.contrast);
  const saturate = clamp(gx("saturate"), ctx.BOUNDS?.saturate);
  const grayscale = clamp(gx("grayscale"), ctx.BOUNDS?.grayscale);
  const sepia = clamp(gx("sepia"), ctx.BOUNDS?.sepia);
  const invert = clamp(gx("invert"), ctx.BOUNDS?.invert);
  const hueRotate = ((gx("hueRotate") % 360) + 360) % 360;
  const opacityFilter = clamp(gx("opacityFilter"), ctx.BOUNDS?.opacityFilter);

  if (brightness !== 1) F.push(`brightness(${brightness})`);
  if (contrast !== 1) F.push(`contrast(${contrast})`);
  if (saturate !== 1) F.push(`saturate(${saturate})`);
  if (grayscale) F.push(`grayscale(${grayscale})`);
  if (sepia) F.push(`sepia(${sepia})`);
  if (invert) F.push(`invert(${invert})`);
  if (hueRotate) F.push(`hue-rotate(${hueRotate}deg)`);
  if (opacityFilter !== 1) F.push(`opacity(${opacityFilter})`);

  // drop-shadow (si alguno está presente, arma el grupo)
  const dsx = gx("dropShadowOffsetX");
  const dsy = gx("dropShadowOffsetY");
  const dsb = gx("dropShadowBlur");
  const dss = gx("dropShadowSpread");
  if (dsx || dsy || dsb || dss) {
    // color fijo por defecto; ajusta si quieres
    F.push(`drop-shadow(${dsx || 0}px ${dsy || 0}px ${dsb || 0}px rgba(0,0,0,0.4))`);
  }

  const filter = F.join(" ") || undefined;

  // ===== Backdrop Filter =====
  const BF = [];
  const backdropBlur = (ctx.isPortrait ? ctx.backdropBaseDeltaPortrait : ctx.backdropBaseDeltaLandscape) ?? 0;
  if (backdropBlur) BF.push(`blur(${backdropBlur}px)`);
  const bb = clamp(gx("backdropBrightness"), ctx.BOUNDS?.backdropBrightness);
  const bc = clamp(gx("backdropContrast"), ctx.BOUNDS?.backdropContrast);
  const bs = clamp(gx("backdropSaturate"), ctx.BOUNDS?.backdropSaturate);
  if (bb !== 1) BF.push(`brightness(${bb})`);
  if (bc !== 1) BF.push(`contrast(${bc})`);
  if (bs !== 1) BF.push(`saturate(${bs})`);
  const backdropFilter = BF.join(" ") || undefined;

  // ===== Opacity (element) =====
  const elementOpacity = clamp(
    (ctx.isPortrait ? ctx.opacityBaseDeltaPortrait : ctx.opacityBaseDeltaLandscape) ?? 0,
    ctx.BOUNDS?.opacity
  );
  const opacity = elementOpacity ? Math.min(1, Math.max(0, 1 + elementOpacity)) : undefined;

  // ===== Metrics / outline / border / shadow =====
  const borderWidth = gx("borderWidth") || undefined;
  const borderRadius = gx("borderRadius") || undefined;
  const outlineWidth = gx("outlineWidth") || undefined;
  const outlineOffset = gx("outlineOffset") || undefined;
  const padding = gx("padding") || undefined;
  const margin = gx("margin") || undefined;
  const zIndex = gx("zIndex") || undefined;
  const aspectRatioVal = gx("aspectRatio") || undefined;
  const aspectRatio = aspectRatioVal ? String(aspectRatioVal) : undefined;

  const bsx = gx("boxShadowOffsetX");
  const bsy = gx("boxShadowOffsetY");
  const bsb = gx("boxShadowBlur");
  const bss = gx("boxShadowSpread");
  const boxShadow = (bsx || bsy || bsb || bss)
    ? `${bsx || 0}px ${bsy || 0}px ${bsb || 0}px ${bss || 0}px rgba(0,0,0,0.35)`
    : undefined;

  // ===== Background =====
  const backgroundPositionX = gx("backgroundPositionX") || undefined;
  const backgroundPositionY = gx("backgroundPositionY") || undefined;
  const backgroundPosition = (backgroundPositionX || backgroundPositionY)
    ? `${backgroundPositionX || 0}px ${backgroundPositionY || 0}px`
    : undefined;

  const backgroundSizeX = gx("backgroundSizeX") || undefined;
  const backgroundSizeY = gx("backgroundSizeY") || undefined;
  const backgroundSize = (backgroundSizeX || backgroundSizeY)
    ? `${backgroundSizeX || 100}% ${backgroundSizeY || 100}%`
    : undefined;

  // ===== Typography =====
  const fontDeltaPct = (ctx.isPortrait ? ctx.fontBaseDeltaPctPortrait : ctx.fontBaseDeltaPctLandscape) ?? 0;
  const fontSize = fontDeltaPct ? `calc(100% + ${fontDeltaPct}%)` : undefined;
  const lineHeight = gx("lineHeight") || undefined;
  const letterSpacing = gx("letterSpacing") ? `${gx("letterSpacing")}px` : undefined;
  const fontWeight = gx("fontWeight") || undefined;
  const wordSpacing = gx("wordSpacing") ? `${gx("wordSpacing")}px` : undefined;
  const textIndent = gx("textIndent") ? `${gx("textIndent")}px` : undefined;
  const textDecorationThickness = gx("textDecorationThickness") || undefined;
  const textUnderlineOffset = gx("textUnderlineOffset") || undefined;
  const WebkitTextStrokeWidth = gx("textStrokeWidth") ? `${gx("textStrokeWidth")}px` : undefined;

  // ===== Gaps =====
  const gap = gx("gap") || undefined;
  const rowGap = gx("rowGap") || undefined;
  const columnGap = gx("columnGap") || undefined;

  const style = {
    transform,
    filter,
    backdropFilter,
    opacity,
    // metrics
    borderWidth: borderWidth && `${borderWidth}px`,
    borderStyle: borderWidth ? "solid" : undefined,
    borderRadius: borderRadius && `${borderRadius}px`,
    outlineWidth: outlineWidth && `${outlineWidth}px`,
    outlineStyle: outlineWidth ? "solid" : undefined,
    outlineOffset: outlineOffset && `${outlineOffset}px`,
    padding: padding && `${padding}px`,
    margin: margin && `${margin}px`,
    zIndex,
    aspectRatio,
    boxShadow,
    // background
    backgroundPosition,
    backgroundSize,
    // type
    fontSize,
    lineHeight,
    letterSpacing,
    fontWeight,
    wordSpacing,
    textIndent,
    textDecorationThickness,
    textUnderlineOffset,
    WebkitTextStrokeWidth,
    // gaps
    gap,
    rowGap,
    columnGap,
  };

  // Limpia undefined para no contaminar el DOM
  Object.keys(style).forEach(k => style[k] === undefined && delete style[k]);
  return style;
}