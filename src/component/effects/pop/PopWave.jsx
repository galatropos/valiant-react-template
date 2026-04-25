import React, { useEffect, useState } from 'react'
import Card from '../../Card'

const PopWave = ({mode,portrait, landscape, style , elements=[], intervalChange=2000 ,rotateWave=10 ,timeWave=1000,scale=1.2,timePop=300}) => {
const [index, setIndex] = useState(0)
const [element, setElement] = useState(elements[0])

    const animate=[
        [{  rotate:rotateWave}, timeWave] ,
        [{    rotate:-rotateWave*2}, timeWave*2] ,
        [{  rotate:rotateWave}, timeWave] ,
      ]

    portrait.animate=animate
    landscape.animate=animate

    useEffect(() => {
        // Creamos el intervalo
        const id = setInterval(() => {
      setIndex((c) => (c + 1) % elements.length);
        }, intervalChange);
    
        // Limpieza: cuando el componente se desmonta, eliminamos el intervalo
        return () => clearInterval(id);
      }, []); // [] asegura que solo se cree una vez
      useEffect(() => {
        // Cuando el index cambia, actualizamos la rotación
    setTimeout(() => {
        portrait.scale=scale
        setTimeout(() => {
            setElement(elements[index])
            portrait.scale=1
        }, 200)
    }, timePop)

      }, [index]);
  return (
    <Card portrait={portrait} landscape={landscape} style={style}
    loop={true}
    controlsAnimate='play'
    mode={mode}
    >
        {element}
    </Card>
  )
}

export default PopWave