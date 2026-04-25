// ⏱️ Reloj con dos modos: "rvfc" (si hay <video>) y "raf" como fallback.
// Notifica ticks al manager con dt en ms.
export default class Clock {
    constructor(onTick) {
      this.onTick = typeof onTick === "function" ? onTick : () => {};
      this.type = "raf";
      this._running = false;
      this._handle = 0;
      this._video = null;
      this._lastTs = performance.now();
    }
  
    setVideoSource(videoEl) {
      this._video = videoEl || null;
      this.type =
        this._video && typeof this._video.requestVideoFrameCallback === "function"
          ? "rvfc"
          : "raf";
    }
  
    start() {
      if (this._running) return;
      this._running = true;
      this._lastTs = performance.now();
  
      if (this.type === "rvfc" && this._video) {
        const step = () => {
          if (!this._running) return;
          const ts = performance.now();
          const dt = ts - this._lastTs;
          this._lastTs = ts;
          this.onTick(dt);
          this._video.requestVideoFrameCallback(step);
        };
        this._video.requestVideoFrameCallback(step);
        return;
      }
  
      const step = () => {
        if (!this._running) return;
        const ts = performance.now();
        const dt = ts - this._lastTs;
        this._lastTs = ts;
        this.onTick(dt);
        this._handle = requestAnimationFrame(step);
      };
      this._handle = requestAnimationFrame(step);
    }
  
    stop() {
      this._running = false;
      if (this._handle) cancelAnimationFrame(this._handle);
      this._handle = 0;
    }
  }
  