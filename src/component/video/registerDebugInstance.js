// 🪪 Expone una instancia en window.players[id] para depuración por consola.
// Devuelve una función de cleanup para usar dentro de useEffect.
export default function registerDebugInstance(id, instance) {
    const ns = (window.players = window.players || {});
    ns[id] = instance;
    console.info(`[VideoToFramesPlayer] ready → window.players["${id}"]`);
  
    return () => {
      if (ns[id] === instance) delete ns[id];
      if (Object.keys(ns).length === 0) delete window.players;
    };
  }
  