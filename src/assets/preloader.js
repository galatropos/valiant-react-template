// src/assets/preloader.js

import "./preloader.css";
import logoUrl from "../../project/chai20251110/assets/image/logo.webp";

// 1) Inyectar el HTML del loader dentro de #preloader
const preloader = document.getElementById("preloader");

if (preloader) {
  preloader.innerHTML = `
    <div class="wrapper">
      ${Array.from({ length: 8 })
        .map(() => `<div class="bubbleWrap"><div class="bubble"></div></div>`)
        .join("")}
      <div class="satWrap">
        <div class="sat"></div>
      </div>
      <svg class="goo-svg">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -7
              "
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>

    <img class="preloader-logo" src="${logoUrl}" alt="Logo" />
  `;
}

// 2) Cuando termine de cargar TODO (imagenes, JS, etc.), ocultar el preloader
window.addEventListener("load", () => {
  const pre = document.getElementById("preloader");
  if (!pre) return;

  // fade-out
  pre.classList.add("preloader--hide");

  // cuando termina la transición, lo removemos del DOM
  const onTransitionEnd = () => {
    pre.removeEventListener("transitionend", onTransitionEnd);
    if (pre && pre.parentNode) {
      pre.parentNode.removeChild(pre);
    }
  };

  pre.addEventListener("transitionend", onTransitionEnd, { once: true });
});
