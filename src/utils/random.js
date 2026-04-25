// Función base que ya tienes
export function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Devuelve un índice aleatorio válido de un array
  export function getRandomArrayIndex(array) {
    return getRandomNumber(0, array.length - 1);
  }
  
  // Devuelve un valor aleatorio del array
  export function getRandomArrayValue(array) {
    const index = getRandomArrayIndex(array);
    return array[index];
  }

  