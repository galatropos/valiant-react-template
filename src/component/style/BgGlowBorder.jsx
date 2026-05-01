import React from 'react'
import hexadecimalToRgba from '../../utils/hexadecimalToRgba'

const BgGlowBorder = ({classNameAssing,colorBorder="white",colorGlow="white", borderRadius=16 ,inset=0,glowExt=20, weight=3,boxShadow=300}) => {

const rgba=hexadecimalToRgba(colorGlow,0.9)

  return (
    <>
     <style>{`
        .${classNameAssing} {
  box-shadow: 0 0 ${boxShadow}px ${rgba};
        }

        /* Glow + “borde redondo” por fuera, SIN tocar la imagen */
        .${classNameAssing}::before {
          content: "";
          position: absolute;
          inset: ${inset}px;              /* se sale 8px del div */
          border-radius: ${borderRadius}px;      /* ESTE es el redondeado */
          box-shadow:
            0 0 0 ${weight}px ${colorBorder},      /* borde tipo outline redondo */
            0 0 ${glowExt}px ${rgba} ; /* glow exterior */
        }
      `}
      </style>
    </>

  )
}

export default BgGlowBorder