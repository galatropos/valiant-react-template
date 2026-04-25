/**
 * Convierte un color en formato HEX (#RRGGBB) o RGB (rgb(r,g,b)) a RGBA.
 *
 * @param {string} c - Color de entrada en uno de estos formatos:
 *   - "#RRGGBB" (hexadecimal de 6 dígitos)
 *   - "rgb(r,g,b)" (función CSS con valores 0-255)
 * @param {number} a - Alpha en rango 0..1 (ej. 0.35). **Importante:** es decimal, no porcentaje.
 * @returns {string} Color en formato "rgba(r,g,b,a)".
 *
 * @example
 * hexadecimalToRgba("#3300CF", 0.35) // "rgba(51,0,207,0.35)"
 * hexadecimalToRgba("rgb(51,0,207)", 0.35) // "rgba(51,0,207,0.35)"
 */
const hexadecimalToRgba = (c, a) => {
  // Si el color empieza con "#", asumimos formato hex "#RRGGBB"
  if (c.startsWith("#")) {
    // Extrae componentes R, G y B en base 16 (00..FF → 0..255)
    const r = parseInt(c.slice(1,3),16);
    const g = parseInt(c.slice(3,5),16);
    const b = parseInt(c.slice(5,7),16);

    // Devuelve en formato rgba(r,g,b,a) usando el alpha decimal recibido
    return `rgba(${r},${g},${b},${a})`;
  }

  // Si no es hex, intentamos convertir "rgb(r,g,b)" → "rgba(r,g,b,a)"
  // El regex captura todo lo de adentro de rgb(...) como un grupo: ([^)]+)
  // Luego lo reinyectamos con $1 y añadimos ",a" al final.
  return c.replace(/^rgb\(([^)]+)\)$/, `rgba($1,${a})`);
};

export default hexadecimalToRgba;
