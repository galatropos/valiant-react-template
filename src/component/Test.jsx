import React from 'react'

import { useScale } from "../context/contextScale";


const Test = () => {


  const escale = useScale();
  console.log(escale)
  return (
    <div>test</div>
  )
}

export default Test