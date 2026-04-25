import React from "react";
import useIsLoading from "../../../hook/useIsLoading";

const TheProgress01 = ({
  children,
  loading = false,
  srcImage,
  fillColor = "#514b82",      // sigue por compat
  backgroundColor = "white",
  width,
  height,
}) => {
  const isLoading = useIsLoading();

  // Cuando ya no está cargando, mostramos el children normal
  if (!isLoading && !loading)
  {
    console.log("Mode render");
    return children;
  }
  console.log("Mode loading");

  return (
    <>
      <style>
        {`
        .theprogress-root {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: ${backgroundColor};
          overflow: hidden;
          box-sizing: border-box;
        }

        .theprogress-image-wrapper {
          position: absolute;
          inset: 0;              /* top:0, right:0, bottom:0, left:0 */
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .theprogress-image {
          width: 100%;
          height: 100%;
          object-fit: cover;   /* llena todo, aunque recorte */
          display: block;
          box-sizing: border-box;
          transform: scaleX(-1);  /* 👈 MODO ESPEJO */
        }

        /* Wrapper para centrar el loader en medio del componente */
        .theprogress-loader-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;  /* no bloquea clicks si hubiera algo debajo */
        }

        /* === Loader 6× el original (doble del anterior TRIPLICADO) ===
           Original:
             width: 90px;
             height: 14px;
             box-shadow: 0 3px 0 #fff;
             background-size: 16px 14px;
             inset calc(50% - 17px);
             height (before): 80px;
             calc(100% - 16px)

           3× (anterior):
             width: 270px;
             height: 42px;
             box-shadow: 0 9px 0 #fff;
             background-size: 48px 42px;
             inset calc(50% - 51px);
             height (before): 240px;
             calc(100% - 48px)

           6× (AHORA):
             width: 540px;
             height: 84px;
             box-shadow: 0 18px 0 #fff;
             background-size: 96px 84px;
             inset calc(50% - 102px);
             height (before): 480px;
             calc(100% - 96px)
        */

        .loader {
          width: 540px;       /* 270 * 2 */
          height: 284px;       /* 42 * 2 */
          box-shadow: 0 18px 0 #fff;  /* 9 * 2 */
          position: relative;
          clip-path: inset(-40px 0 -5px);
        }

        .loader:before {
          content: "";
          position: absolute;
          inset: auto calc(50% - 102px) 0;  /* 51 * 2 */
          height: 480px;                    /* 240 * 2 */
          --g:no-repeat linear-gradient(#ccc 0 0);
          background: var(--g),var(--g),var(--g),var(--g);
          background-size: 96px 84px;       /* 48x42 * 2 */
          animation:
            l7-1 2s infinite linear,
            l7-2 2s infinite linear;
        }

        @keyframes l7-1 {
          0%,
          100%  {background-position: 0 -50px,100% -50px}
          17.5% {background-position: 0 100%,100% -50px,0 -50px,100% -50px}
          35%   {background-position: 0 100%,100% 100% ,0 -50px,100% -50px}
          52.5% {background-position: 0 100%,100% 100% ,0 calc(100% - 96px),100% -50px}
          70%,
          98%  {background-position: 0 100%,100% 100% ,0 calc(100% - 96px),100% calc(100% - 96px)}
        }

        @keyframes l7-2 {
          0%,70% {transform:translate(0)}
          100%  {transform:translate(200%)}
        }
      `}
      </style>

      <div className="theprogress-root">
        {/* Imagen ocupando TODO el componente */}
        <div className="theprogress-image-wrapper">
          <img
            src={srcImage}
            alt="loading"
            className="theprogress-image"
            fetchPriority="high"
            loading="eager"
            importance="high"
            // Si algún día quieres limitarlo por props:
            // style={{
            //   maxWidth: width ? `${width}px` : undefined,
            //   maxHeight: height ? `${height}px` : undefined,
            // }}
          />
        </div>

        {/* Loader centrado en medio */}
        <div className="theprogress-loader-wrapper">
          <div className="loader"></div>
        </div>
      </div>
    </>
  );
};

export default TheProgress01;
