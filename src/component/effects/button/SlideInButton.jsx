// SlideInButton.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

// Icono de flecha simple (usa currentColor)
function ArrowIcon({ size = 18, style = {} }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size, display: "block", ...style }}
    >
      <path
        d="M6 12h10M12 6l4 6-4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Configuración aproximada de tamaños (L, M, S)
const SIZE_CONFIG = {
  L: {
    paddingY: 14,
    paddingX: 26,
    fontSize: 16,
    iconSize: 19,
  },
  M: {
    paddingY: 10,
    paddingX: 22,
    fontSize: 15,
    iconSize: 17,
  },
  S: {
    paddingY: 5,
    paddingX: 18,
    fontSize: 14,
    iconSize: 16,
  },
};

const transitionFill = {
  type: "spring",
  bounce: 0.15,
  duration: 0.6,
};

const transitionColor = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
};

/**
 * SlideInButton
 */
export default function SlideInButton({
  text = "Get Started",
  href,
  newTab = false,
  size = "L",
  defaultBackgroundColor = "#ffffff",
  hoverBackgroundColor = "#0055ff",
  defaultTextColor = "#000000",
  hoverTextColor = "#ffffff",
  iconColor,
  iconHoverColor,
  className = "",
  style = {},
  ...rest
}) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.L;
  const [isHovered, setIsHovered] = useState(false);

  const anchorProps = href
    ? {
        href,
        target: newTab ? "_blank" : "_self",
        rel: newTab ? "noopener noreferrer" : undefined,
      }
    : {
        href: "#",
      };

  const baseIconColor = iconColor ?? defaultTextColor;
  const baseIconHoverColor = iconHoverColor ?? hoverTextColor;

  // Escalas del círculo (pequeño visible + grande que cubre todo)
  const baseScale = 0.25;
  const hoverScale = 4;

  return (
    <motion.a
      {...anchorProps}
      {...rest}
      className={className}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        cursor: "pointer",
        position: "relative",
        overflow: "visible",
        padding: 0,
        borderRadius: 999,
        background: "transparent",
        ...style,
      }}
    >
      {/* Contenedor principal del botón */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: `${config.paddingY}px ${config.paddingX}px`,
          borderRadius: 39,
          backgroundColor: defaultBackgroundColor,
          overflow: "hidden",
        }}
      >
        {/* CÍRCULO AZUL: pequeño en medio ARRIBA, se expande en hover */}
        <motion.div
          animate={{
            scale: isHovered ? hoverScale : baseScale,
          }}
          transition={transitionFill}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,                     // borde superior del botón
            width: 120,
            height: 120,
            transform: "translate(-50%, -50%)", // centro justo encima del borde
            transformOrigin: "50% 50%",
            borderRadius: "50%",
            backgroundColor: hoverBackgroundColor,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Texto */}
        <motion.span
          animate={{
            color: isHovered ? hoverTextColor : defaultTextColor,
          }}
          transition={transitionColor}
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont`,
            fontSize: config.fontSize,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </motion.span>

        {/* Icono a la derecha */}
        <motion.div
          animate={{
            color: isHovered ? baseIconHoverColor : baseIconColor,
          }}
          transition={transitionColor}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: config.iconSize + 2,
            height: config.iconSize + 2,
          }}
        >
          <ArrowIcon size={config.iconSize} />
        </motion.div>
      </div>
    </motion.a>
  );
}
