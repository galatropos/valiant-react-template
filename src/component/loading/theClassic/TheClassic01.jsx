import React from "react";
import useIsLoading from "../../../hook/useIsLoading";
import Card from "../../Card";

const TheClassic01 = ({ children,loading=false, text = "Cargando...sadasdasdasd" }) => {
  const isLoading = useIsLoading();
  if (!isLoading && !loading) return children;

  return (
    <Card
      landscape={{width: 1,height: 1,x: 50,y: 50,anchor: "middle"}}
      portrait={{ width: 1, height: 1, x: 50, y: 50, anchor: "middle" }}
    >
      <style>{`
        .loader {
          font-weight: bold;
          font-size: 30px;
          animation: l1 1s linear infinite alternate;
          }
        .loader::before {
          content: "${text}";
        }
        @keyframes l1 {
          to { opacity: 0; }
        }
      `}</style>
      <div className="loader" />
    </Card>
  );
};

export default TheClassic01;
