import React from "react";
import { createPortal } from "react-dom";
import { COMMAND_LABELS_BANKS, BANK_TITLES } from "./banks";

/**
 * Command
 * Renderiza el overlay de comandos (bancos 1..9) con sus etiquetas.
 * Props:
 *  - visible: boolean
 *  - activeGroup: number (1..9)
 *  - onRequestClose: () => void
 */
export default function Command({ visible = false, activeGroup = 1, onRequestClose }) {
  if (!visible) return null;
  const labels = COMMAND_LABELS_BANKS[activeGroup] || {};
  const title = BANK_TITLES[activeGroup] || "";

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        zIndex: 2147483647,
        pointerEvents: "auto"
      }}
      onClick={onRequestClose}
    >
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          minWidth: 340,
          maxWidth: "86%",
          padding: 18,
          background: "#0b0b0e",
          color: "#fff",
          borderRadius: 14,
          border: "1px solid #3300CF",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          zIndex: 2147483647,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{fontSize: 18, fontWeight: 800}}>
          Banco {activeGroup} <span style={{opacity: 0.8}}>({title})</span>
        </div>
        <div style={{fontSize: 12, opacity: 0.9}}>
          Mantén <b>una letra</b> para numéricos o escribe <b>alias de 2 letras</b>. Luego usa la rueda o arrastra ↑/↓. 1..9 cambia de banco. Esc cierra.
        </div>
        <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "center", maxHeight: "45vh", overflow: "auto", paddingRight: 6}}>
          {Object.entries(labels).map(([k, label]) => (
            <React.Fragment key={k}>
              <code style={{display:"inline-block", minWidth: 44, textAlign:"center", padding:"4px 8px", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, fontSize:12, letterSpacing: 0.5}}>
                {k.toUpperCase()}
              </code>
              <span style={{fontSize: 14}}>{label}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{opacity: 0.8, fontSize: 12, marginTop: 4}}>Presiona Esc para cerrar.</div>
      </div>
    </div>,
    document.body
  );
}
