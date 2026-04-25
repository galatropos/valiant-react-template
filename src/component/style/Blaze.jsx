import React from 'react'

const Blaze = ({image,classNameAssing}) => {
  return (
    <style>{`
        /* No añadimos ningún color de fondo; solo luz blanca con blend para respetar el color del botón */
        .${classNameAssing} { position: relative; }

        /* Luz interior (blanca) con mezcla SCREEN → ilumina sin cambiar el tono */
        .${classNameAssing}::before{
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;

          /* Gradiente suave al centro + halo a bordes, todo blanco */
  
          filter: blur(10px);
          opacity: 0.9;
          mix-blend-mode: screen;   /* clave: respeta el color original del botón */

          /* Recorte a la silueta del CTA (misma imagen) */
          -webkit-mask: url(${image}) center / contain no-repeat;
                  mask: url(${image}) center / contain no-repeat;

          /* Refuerzo leve en el borde interior */
          box-shadow: inset 0 0 24px 8px rgba(255,255,255,0.25);

          /* Animación suave solo de luz (sin escala) */
          animation: lightPulse 2.4s ease-in-out infinite;
        }

        /* Destello que cruza por dentro: blanco + screen para no teñir */
        .${classNameAssing}::after{
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;

          background:
            linear-gradient(90deg,
              rgba(255,255,255,0.00) 0%,
              rgba(255,255,255,0.30) 46%,
              rgba(255,255,255,0.65) 50%,
              rgba(255,255,255,0.30) 54%,
              rgba(255,255,255,0.00) 100%
            );
          background-size: 220% 100%;
          background-position: -60% 0;
          filter: blur(6px);
          opacity: 0.45;
          mix-blend-mode: screen;

          -webkit-mask: url(${image}) center / contain no-repeat;
                  mask: url(${image}) center / contain no-repeat;

          animation: sweep 3.0s linear infinite;
        }

        /* Interacciones (sin escala) */
        .${classNameAssing}:hover::before,
        .${classNameAssing}:focus::before{ opacity: 1; filter: blur(12px); }
        .${classNameAssing}:hover::after,
        .${classNameAssing}:focus::after{ opacity: 0.65; }
        .${classNameAssing}:active::before{ filter: blur(8px); opacity: 0.85; }
        .${classNameAssing}:active::after{ opacity: 0.35; }

        @keyframes lightPulse{
          0%,100% { opacity: .75; filter: blur(8px); }
          50%     { opacity: 1;   filter: blur(14px); }
        }
        @keyframes sweep{
          0%   { background-position: -60% 0; }
          100% { background-position: 160% 0; }
        }

        @media (prefers-reduced-motion: reduce){
          .${classNameAssing}::before,
          .${classNameAssing}::after{ animation: none !important; }
        }
      `}</style>
  )
}

export default Blaze