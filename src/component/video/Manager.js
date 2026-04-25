// src/component/video/Manager.js
// TimelineManager (Pasos 1–10) + Paso 11 (robustez: tolerancias/histeresis)

import Clock from "./Clock.js";
import { normalizeBlocks, sortBlocks, summarizeBlocks } from "./blocks.js";
import { onBlockEnter, onBlockExit } from "./actions.js";
import attachSniper from "./sniper.js";
import {
  FRAME_TOL_MS,
  CUE_WINDOW_MS,
  HYST_AFTER_SEEK_MS,
  HYST_AFTER_LOOP_MS,
} from "./constants.js";

export default class TimelineManager {
  constructor(opts = {}) {
    // Estado base
    this.currentMs = 0;
    this.isPlaying = false;
    this.velocity = 1.0;
    this.durationMs = Number.isFinite(opts.durationMs) ? Math.max(0, opts.durationMs) : 0;

    // Audio (Paso 10)
    this.muted = true;
    this.audioUnlocked = false;
    this.pendingUnmute = false;
    this.audioPolicy = "unmuteOnInteract";

    // Diagnóstico video (paso 2)
    this._videoState = { driftMs: 0 };

    // Blocks/cues (pasos 3–4)
    this._blocks = [];
    this._blockErrors = [];
    this._activeIds = new Set();
    this._listeners = Object.create(null);

    // Acciones (paso 5)
    this._visibleTargets = new Set();
    this._overlays = new Set();
    this._pausedByBlocks = new Set();
    this._velStack = [];
    this._velocityEffective = 1.0;
    this._videoLayer = null;

    // Control (paso 6)
    this._pauseResumeMap = new Map();
    this._awaitingNext = null;
    this._loopRanges = new Map();

    // Robustez (paso 11)
    this._programmaticCooldownUntil = 0;     // evita enters durante soft/hard seek
    this._hysteresisUntil = 0;               // histeresis general tras seek/loop
    this._lastEvtByBlock = new Map();        // { blockId -> {enterAt, exitAt} en performance.now() }
    this._now = 0;                            // cache del tiempo actual en tick/seek

    // Holds (paso 7)
    this._holds = new Map();

    // Clock
    this._clock = new Clock((dt) => this._tick(dt));
    this._clock.type = "raf";
    this._lastDtMs = 0;

    // Paso 8: sniper headless
    this.sniper = attachSniper(this);
  }

  // ---------- Event Emitter ----------
  on(eventName, fn) {
    if (!fn) return () => {};
    const set = (this._listeners[eventName] ||= new Set());
    set.add(fn);
    return () => set.delete(fn);
  }
  off(eventName, fn) { this._listeners[eventName]?.delete(fn); }
  _emit(eventName, payload) {
    const set = this._listeners[eventName];
    if (set && set.size) { for (const fn of set) { try { fn(payload); } catch {} } }
    try { this.sniper?._onManagerEvent?.(eventName, payload); } catch {}
  }

  // ---------- Control ----------
  play() { if (!this.isPlaying) { this.isPlaying = true; this._clock.start(); } }
  pause() { if (this.isPlaying) { this.isPlaying = false; this._clock.stop(); } }
  stop() { this.pause(); this.seek(0); }

  seek(ms) {
    const t = Math.max(0, Math.min(Number(ms) || 0, this.durationMs || Number.MAX_SAFE_INTEGER));
    this.currentMs = t;
    this._now = typeof performance !== "undefined" ? performance.now() : Date.now();
    // soft/hard seek → activar ventanas de histeresis para no redispaarar enter/exit dobles
    this._hysteresisUntil = Math.max(this._hysteresisUntil, this._now + HYST_AFTER_SEEK_MS);
    this._processBlocksAt(t, /*isTick*/ false);
  }
  seekRel(deltaMs) { this.seek((this.currentMs || 0) + (Number(deltaMs) || 0)); }

  setVelocity(v) { const val = Number(v); if (Number.isFinite(val)) { this.velocity = val; this._recomputeEffectiveVelocity(); } }
  setDuration(ms) { const d = Number(ms); if (Number.isFinite(d)) this.durationMs = Math.max(0, d); }
  setClockSource(videoEl) { this._clock.setVideoSource(videoEl || null); }

  // ---------- Señales externas ----------
  signal(type, payload = {}) {
    if (type === "user.next" && this._awaitingNext) {
      const { jumpToMs, playOnNext } = this._awaitingNext;
      this._awaitingNext = null;
      this._markProgrammaticSeek(HYST_AFTER_SEEK_MS);
      if (Number.isFinite(jumpToMs)) this.seek(jumpToMs);
      if (playOnNext) this.play();
      this._emit("next", { type: "next", tMs: this.currentMs });
      return;
    }
    if (type === "user.audioGesture") { this.unlockAudio(); return; }
    if (type === "pressStart" || type === "pressEnd") {
      const targetId = payload?.targetId || this._findTopmostActiveHoldId();
      if (!targetId) return;
      const hold = this._holds.get(targetId);
      if (!hold) return;
      if (type === "pressStart") this._onPressStart(hold);
      else this._onPressEnd(hold, /*outside*/ false);
      return;
    }
    if (type === "pressCancel") {
      const targetId = payload?.targetId || this._findTopmostActiveHoldId();
      const hold = targetId ? this._holds.get(targetId) : null;
      if (!hold) return;
      this._onPressEnd(hold, /*outside*/ true);
    }
  }

  // ---------- Audio Policy (Paso 10) ----------
  setAudioPolicy(policy) {
    const p = String(policy || "").trim();
    if (p === "manual" || p === "unmuteOnInteract") {
      this.audioPolicy = p; this._emit("audioPolicy", { policy: this.audioPolicy });
      return { ok: true, policy: this.audioPolicy };
    }
    return { ok: false, error: "policy inválida" };
  }
  unlockAudio() {
    if (this.audioUnlocked) return { ok: true, changed: false };
    this.audioUnlocked = true;
    if (this.pendingUnmute) { this.pendingUnmute = false; this.muted = false; }
    this._emit("audio", { type: "unlocked", status: this._audioStatus() });
    return { ok: true, changed: true };
  }
  mute() { this.muted = true; this.pendingUnmute = false; this._emit("audio", { type: "mute", status: this._audioStatus() }); }
  unmute() {
    if (this.audioUnlocked) { this.muted = false; this.pendingUnmute = false; }
    else { this.pendingUnmute = true; this.muted = true; }
    this._emit("audio", { type: "unmute", status: this._audioStatus() });
  }
  toggleMute() { if (this.muted) this.unmute(); else this.mute(); }
  _audioStatus() { return { muted: !!this.muted, audioUnlocked: !!this.audioUnlocked, pendingUnmute: !!this.pendingUnmute, policy: this.audioPolicy }; }

  // ---------- Holds helpers (paso 7) ----------
  _findTopmostActiveHoldId() {
    const active = Array.from(this._activeIds);
    for (let i = active.length - 1; i >= 0; i--) {
      const id = active[i];
      const b = this._blocks.find(x => x.id === id);
      if (b && (b.action === "holdToPlay" || b.action === "holdToPause")) return id;
    }
    return null;
  }
  _onPressStart(hold) {
    if (hold.pressActive) return;
    hold.pressActive = true; hold.pressStartedAt = performance.now();
    if (hold.type === "holdToPlay") { const mult = Number.isFinite(hold.velocityWhileHold) ? hold.velocityWhileHold : 1; this._beginHoldVelocity(hold.blockId, mult); this.play(); }
    else if (hold.type === "holdToPause") { this.pause(); }
  }
  _onPressEnd(hold, outsideRelease) {
    if (!hold.pressActive) {
      if (outsideRelease) { if (hold.type === "holdToPause") { if (hold.outsideRelease === "keepPaused") this.pause(); else this.play(); } }
      return;
    }
    const elapsed = performance.now() - (hold.pressStartedAt || 0);
    hold.pressActive = false;
    const threshold = Number.isFinite(hold.pressThresholdMs) ? hold.pressThresholdMs : 0;
    if (hold.type === "holdToPlay") {
      this._endHoldVelocity(hold.blockId);
      const crossed = this.currentMs >= hold.endMs - 0.5;
      if (crossed) { this.play(); }
      else { let revertToMs = (hold.revertTo === "start") ? hold.startMs : hold.enterMs; if (elapsed < threshold) revertToMs = (hold.revertTo === "start") ? hold.startMs : hold.enterMs; this.seek(revertToMs); this.pause(); }
    }
    if (hold.type === "holdToPause") { if (outsideRelease) { if (hold.outsideRelease === "keepPaused") this.pause(); else this.play(); } else { this.play(); } }
  }
  _beginHoldVelocity(blockId, mult) {
    const id = `hold:${blockId}`; const idx = this._velStack.findIndex(x => x.id === id); if (idx >= 0) this._velStack.splice(idx, 1);
    if (Number.isFinite(mult) && mult > 0 && mult !== 1) { this._velStack.push({ id, mult }); this._recomputeEffectiveVelocity(); }
  }
  _endHoldVelocity(blockId) { const id = `hold:${blockId}`; const idx = this._velStack.findIndex(x => x.id === id); if (idx >= 0) { this._velStack.splice(idx, 1); this._recomputeEffectiveVelocity(); } }

  // ---------- Avance manual / reloj ----------
  step(dtMs) { const dt = Number(dtMs) || 0; if (dt > 0) this._tick(dt); }
  _recomputeEffectiveVelocity() { let eff = this.velocity; for (const item of this._velStack) eff *= item.mult; this._velocityEffective = Number.isFinite(eff) ? eff : 1.0; }
  _markProgrammaticSeek(extraHystMs = 0) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    this._programmaticCooldownUntil = now + Math.max(HYST_AFTER_SEEK_MS, extraHystMs);
    this._hysteresisUntil = Math.max(this._hysteresisUntil, now + Math.max(HYST_AFTER_SEEK_MS, extraHystMs));
  }
  _inProgrammaticCooldown() { const now = typeof performance !== "undefined" ? performance.now() : Date.now(); return now < this._programmaticCooldownUntil; }

  _tick(dtMs) {
    this._lastDtMs = dtMs;
    if (this.isPlaying) {
      const vel = Number.isFinite(this._velocityEffective) ? this._velocityEffective : 1;
      let next = this.currentMs + dtMs * vel;
      if (Number.isFinite(this.durationMs) && this.durationMs > 0) next = Math.min(next, this.durationMs);
      this.currentMs = next;
    }
    this._now = typeof performance !== "undefined" ? performance.now() : Date.now();
    this._processBlocksAt(this.currentMs, /*isTick*/ true);
  }

  // ---------- Blocks ----------
  loadBlocks(list) {
    const { blocks, errors } = normalizeBlocks(list);
    this._blocks = sortBlocks(blocks);
    this._blockErrors = errors || [];

    // reset estado
    this._activeIds.clear();
    this._visibleTargets.clear(); this._overlays.clear();
    this._pausedByBlocks.clear();
    this._velStack = []; this._recomputeEffectiveVelocity();
    this._videoLayer = null;
    this._pauseResumeMap.clear();
    this._awaitingNext = null;
    this._loopRanges.clear();
    this._programmaticCooldownUntil = 0;
    this._hysteresisUntil = 0;
    this._lastEvtByBlock.clear();
    this._holds.clear();

    this._processBlocksAt(this.currentMs, /*isTick*/ false);
    return { count: this._blocks.length, errors: this._blockErrors };
  }

  listBlocks() { return summarizeBlocks(this._blocks); }
  getCurrentBlock(tMs = undefined) {
    const t = Number.isFinite(tMs) ? tMs : this.currentMs;
    for (let i = 0; i < this._blocks.length; i++) {
      const b = this._blocks[i];
      const end = b.endMs == null ? Infinity : b.endMs;
      if (t >= b.startMs && t < end) return b;
    }
    return null;
  }
  getBlockErrors() { return this._blockErrors; }

  // ---------- enter / tick / exit ----------
  _isActiveAt(b, t) {
    // pequeña ventana para estabilidad en bordes
    const end = b.endMs == null ? Infinity : b.endMs;
    if (t + CUE_WINDOW_MS < b.startMs) return false;
    if (t >= end + CUE_WINDOW_MS) return false;
    return t >= b.startMs && t < end;
  }
  _eventPayload(type, block) {
    return { type, tMs: Math.round(this.currentMs), block, blockId: block.id, action: block.action, state: this.isPlaying ? "playing" : "paused", velocity: this._velocityEffective };
  }
  _shouldEmit(blockId, kind, now) {
    const rec = this._lastEvtByBlock.get(blockId) || { enterAt: -Infinity, exitAt: -Infinity };
    const lastAt = (kind === "enter") ? rec.enterAt : rec.exitAt;
    // evita spam si el último evento fue hace menos que 1 frame
    return (now - lastAt) >= FRAME_TOL_MS;
  }
  _markEvt(blockId, kind, now) {
    const rec = this._lastEvtByBlock.get(blockId) || { enterAt: -Infinity, exitAt: -Infinity };
    if (kind === "enter") rec.enterAt = now; else rec.exitAt = now;
    this._lastEvtByBlock.set(blockId, rec);
  }

  _processBlocksAt(t, isTick) {
    const now = this._now || (typeof performance !== "undefined" ? performance.now() : Date.now());
    const inCool = this._inProgrammaticCooldown();
    const inHyst = now < this._hysteresisUntil;

    const nextActive = new Set();
    for (const b of this._blocks) if (this._isActiveAt(b, t)) nextActive.add(b.id);

    // Exits
    for (const id of this._activeIds) {
      if (!nextActive.has(id)) {
        const b = this._blocks.find((x) => x.id === id);
        if (b && this._shouldEmit(id, "exit", now)) {
          const payload = this._eventPayload("blockExit", b);
          onBlockExit(this, b);
          this._emit("blockExit", payload);
          this._callBlockCallbacks("exit", b, payload);
          this._markEvt(id, "exit", now);
        }
      }
    }

    // Enters
    for (const id of nextActive) {
      if (!this._activeIds.has(id)) {
        if (inCool || inHyst) continue; // anti-doble-disparo post seek/loop
        const b = this._blocks.find((x) => x.id === id);
        if (b && this._shouldEmit(id, "enter", now)) {
          const payload = this._eventPayload("blockEnter", b);
          onBlockEnter(this, b);
          this._emit("blockEnter", payload);
          this._callBlockCallbacks("enter", b, payload);
          this._markEvt(id, "enter", now);
        }
      }
    }

    this._activeIds = nextActive;

    // Ticks
    if (isTick && this._activeIds.size) {
      for (const id of this._activeIds) {
        const b = this._blocks.find((x) => x.id === id);
        if (b) {
          const payload = this._eventPayload("blockTick", b);
          this._emit("blockTick", payload);
          this._callBlockCallbacks("tick", b, payload);
        }
      }
    }
  }

  _callBlockCallbacks(kind, block, payload) {
    const { props } = block;
    try {
      if (kind === "enter" && typeof props?.callbackBefore === "function") props.callbackBefore(payload);
      else if (kind === "tick" && typeof props?.callback === "function")   props.callback(payload);
      else if (kind === "exit" && typeof props?.callbackAfter === "function") props.callbackAfter(payload);
    } catch {}
  }

  // ---------- Snapshot ----------
  getSnapshot() {
    return {
      tMs: Math.round(this.currentMs),
      state: this.isPlaying ? "playing" : "paused",
      velocity: this._velocityEffective,
      baseVelocity: this.velocity,
      durationMs: Number.isFinite(this.durationMs) ? Math.round(this.durationMs) : null,
      muted: !!this.muted,
      audioUnlocked: !!this.audioUnlocked,
      pendingUnmute: !!this.pendingUnmute,
      audioPolicy: this.audioPolicy,
      video: {
        driftMs: Math.round(this._videoState?.driftMs || 0),
        layer: this._videoLayer ? { ...this._videoLayer, props: undefined } : null,
      },
      ui: {
        visibleTargets: Array.from(this._visibleTargets),
        overlays: Array.from(this._overlays),
        awaitingNext: this._awaitingNext ? { ...this._awaitingNext } : null,
      },
      loops: {
        active: Array.from(this._loopRanges.values()).map(r => ({ id: r.id, count: r.count, max: r.max })),
      },
      holds: {
        active: Array.from(this._holds.values()).map(h => ({ id: h.blockId, type: h.type, pressActive: h.pressActive })),
      },
      clock: { type: this._clock.type, lastDtMs: this._lastDtMs },
      blocks: { count: this._blocks.length, activeCount: this._activeIds.size },
      performance: {
        tolerances: { FRAME_TOL_MS, CUE_WINDOW_MS, HYST_AFTER_SEEK_MS, HYST_AFTER_LOOP_MS },
        inCooldown: this._inProgrammaticCooldown(),
        hysteresisActive: (typeof performance !== "undefined" ? performance.now() : Date.now()) < this._hysteresisUntil,
      },
    };
  }

  // ---------- Video drift (paso 2) ----------
  setVideoDrift(driftMs) { const v = Number(driftMs); if (Number.isFinite(v)) this._videoState.driftMs = v; return this.getSnapshot(); }

  // ---------- Helpers extra (pasos 9–10) ----------
  insertBlock(block) {
    const { blocks, errors } = normalizeBlocks([block]);
    if (errors?.length) console.warn("[manager.insertBlock] errores:", errors);
    if (!blocks.length) return { ok: false, error: "bloque inválido" };
    this._blocks = sortBlocks([...this._blocks, blocks[0]]);
    this._processBlocksAt(this.currentMs, /*isTick*/ false);
    return { ok: true, id: blocks[0].id };
  }
  removeBlock(id) {
    const before = this._blocks.length;
    this._blocks = this._blocks.filter(b => b.id !== id);
    const removed = before !== this._blocks.length;
    if (removed) this._processBlocksAt(this.currentMs, /*isTick*/ false);
    return { ok: removed };
  }
  setBlockProp(id, path, value) {
    const blk = this._blocks.find(b => b.id === id);
    if (!blk) return { ok: false, error: "no existe el bloque" };
    if (path === "startMs" || path === "endMs") {
      const v = Number(value); if (!Number.isFinite(v) || v < 0) return { ok: false, error: "valor inválido" };
      blk[path] = Math.floor(v);
    } else if (path === "action") {
      if (typeof value !== "string" || !value.trim()) return { ok: false, error: "action inválida" };
      blk.action = value.trim();
    } else if (path.startsWith("props.")) {
      const key = path.slice("props.".length); if (!key) return { ok: false, error: "prop inválida" };
      blk.props = blk.props || {}; blk.props[key] = value;
    } else {
      return { ok: false, error: "path inválido" };
    }
    this._blocks = sortBlocks(this._blocks);
    this._processBlocksAt(this.currentMs, /*isTick*/ false);
    return { ok: true, block: { id: blk.id, action: blk.action, startMs: blk.startMs, endMs: blk.endMs } };
  }
  activateBlock(id, { play = false } = {}) {
    const blk = this._blocks.find(b => b.id === id);
    if (!blk) return { ok: false, error: "no existe el bloque" };
    const t = blk.startMs || 0;
    this._markProgrammaticSeek(HYST_AFTER_SEEK_MS);
    this.seek(t);
    if (play) this.play();
    return { ok: true, tMs: this.currentMs };
  }
  skipCurrentBlock() {
    const blk = this.getCurrentBlock();
    if (!blk) return { ok: false, error: "no hay bloque activo" };
    if (!Number.isFinite(blk.endMs)) return { ok: false, error: "bloque sin endMs" };
    this._markProgrammaticSeek(HYST_AFTER_SEEK_MS);
    this.seek(blk.endMs);
    return { ok: true, tMs: this.currentMs };
  }
  jumpToNextTimeMs(deltaMs) {
    const d = Number(deltaMs); if (!Number.isFinite(d)) return { ok: false, error: "delta inválido" };
    this._markProgrammaticSeek(HYST_AFTER_SEEK_MS);
    this.seekRel(Math.floor(d));
    return { ok: true, tMs: this.currentMs };
  }
}
