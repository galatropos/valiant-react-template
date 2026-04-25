import { createContext, useContext } from "react";

export const ScaleContext = createContext({
  x: 1,
  y: 1,
  min: 1,
  width: 0,
  height: 0,
});

export function useScale() {
  return useContext(ScaleContext);
}