import React from 'react'
import useIsLoading from '../../../hook/useIsLoading';

const TheProgress01 = ({children,loading=false,  srcImage, fillColor = "#514b82", backgroundColor = "white" ,width, height}) => {
  
    const isLoading = useIsLoading();
  if (!isLoading && !loading) return children;
    return (
    <>
    <style>
      {`
      .content{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%; 
      gap:30px;
      background-color: ${backgroundColor};

      }
        .loader {
          width: 50%;
          height: 22px;
          border-radius: 20px;
          color: ${fillColor};
          border: 2px solid;
          position: relative;
        }

        .loader::before {
          content: "";
          position: absolute;
          margin: 2px;
          inset: 0 100% 0 0;
          border-radius: inherit;
          background: currentColor;
          animation: l6 2s infinite;
        }

        @keyframes l6 {
          100% { inset: 0; }
        }
      `}
    </style>
    <div className='content'>
    {
        <img src={srcImage} alt="loading" height={height} width={width} fetchpriority="high" rel='preload'/>
    }
    <div className="loader"></div>
    </div>
  </>
  )
}

export default TheProgress01