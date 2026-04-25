import { useState, useEffect } from "react";

export function useContainerScale(ref) {
  const [scale, setScale] = useState({ x: 1, y: 1 });

  const updateScale = () => {
    if (!ref.current) return;

    const containerWidth = ref.current.offsetWidth;
    const containerHeight = ref.current.offsetHeight;

    const scaleX = window.innerWidth / containerWidth;
    const scaleY = window.innerHeight / containerHeight;

    setScale({ x: scaleX, y: scaleY });
  };

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [ref]);

  return scale;
}