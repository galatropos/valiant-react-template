import React, { useEffect, useMemo, useState } from "react";
import Card from "../../Card";

// Helpers
const isImgNode = (node) => node?.type === "img" && node?.props?.src;
const getSrc = (node) => (isImgNode(node) ? node.props.src : null);

const preloadAllImages = async (nodes = []) => {
  const srcs = nodes.map(getSrc).filter(Boolean);
  await Promise.all(
    srcs.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
      return (
        img.decode?.().catch(() => {}) ||
        new Promise((res) => {
          img.onload = img.onerror = () => res();
        })
      );
    })
  );
};

const PopDefault = ({
  elements = [],
  intervalChange = 1000,
  initialDelay = 0,
  portrait,
  landscape,
  mode,
  style,
}) => {
  const [index, setIndex] = useState(0);

  // Preload de TODAS las imágenes una sola vez
  useEffect(() => {
    if (elements.length === 0) return;
    preloadAllImages(elements);
  }, [elements]);

  // Ciclo de avance
  useEffect(() => {
    if (elements.length === 0) return;
    let id;
    const t0 = setTimeout(() => {
      id = setInterval(() => {
        setIndex((i) => (i + 1) % elements.length);
      }, intervalChange);
    }, Math.max(0, initialDelay));
    return () => {
      clearTimeout(t0);
      if (id) clearInterval(id);
    };
  }, [elements.length, intervalChange, initialDelay]);

  // Capas apiladas, todas montadas
  const layerBase = useMemo(
    () => ({
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none", // evita capturar clicks
      transform: "translateZ(0)", // promueve a GPU
      backfaceVisibility: "hidden",
      contain: "layout paint size",
      isolation: "isolate",
    }),
    []
  );

  return (
    <Card portrait={portrait} landscape={landscape} style={style} mode={mode}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          // Si quieres ver lo de atrás, deja transparente
          backgroundColor: style?.backgroundColor ?? "transparent",
          contain: "layout paint size",
          isolation: "isolate",
        }}
      >
        {elements.map((el, i) => (
          <div
            key={i}
            style={{
              ...layerBase,
              // 🔥 Solo el elemento activo visible; los demás realmente ocultos
              opacity: i === index ? 1 : 0,
              visibility: i === index ? "visible" : "hidden",
            }}
            aria-hidden={i !== index}
          >
            {isImgNode(el)
              ? React.cloneElement(el, {
                  loading: el.props.loading ?? "eager",
                  decoding: el.props.decoding ?? "async",
                  style: {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: el.props.style?.objectFit || "contain",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    ...(el.props.style || {}),
                  },
                })
              : el}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PopDefault;
