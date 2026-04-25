import { useState, useEffect } from "react";
import Card from "./Card";
import TheClassic01 from "./loading/theClassic/TheClassic01";

function Loading({
  children,
  timeout = 0,
  text = "Cargando...",
  image = "https://play-lh.googleusercontent.com/8oVK1GwHBC6jfIt6HCrz_m7V1hSuR9TjzjZbQK7DOM-deJ3dYSfivqAIZaYMxFGD",
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
             setTimeout(() =>
              {

                  //   setLoading(false)
              }
             , timeout);
    };

    if (document.readyState === "complete") {
      setLoading(false);
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);
  const styleCard = {
    borderRadius: "100px",
    backgroundImage: `url("${image}")`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  

  return (
    <>
      {loading && (
        <div style={loaderStyle}>
          <Card
            landscape={{
              width: 20,
              height: 35,
              x: 50,
              y: 50,
              anchor: "middle",
            }}
            portrait={{ width: 50, height: 50, x: 50, y: 50, anchor: "middle" }}
            style={styleCard}
          ></Card>
          <h2>{text}

            <TheClassic01 />

          </h2>
        </div>
      )}
      {!loading && children}
    </>
  );
}

const loaderStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "1.5rem",
  zIndex: 9999,
};

export default Loading;
