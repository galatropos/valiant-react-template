// src/component/video/control.js
// Paso 9 + Paso 10 — API de consola: window.control con audio helpers

(function initControlNS() {
  const ns = (window.control = window.control || {});
  const state = { currentId: null };

  function _players() { return window.players || {}; }
  function _firstId() { const ids = Object.keys(_players()); return ids.length ? ids[0] : null; }
  function _mgr() {
    const p = _players();
    const id = state.currentId && p[state.currentId] ? state.currentId : _firstId();
    return id ? p[id] : null;
  }

  ns.list = () => Object.keys(_players());
  ns.select = (id) => {
    const p = _players();
    if (id && p[id]) {
      state.currentId = id;
      console.info(`[control] seleccionado: ${id}`);
      return id;
    }
    const first = _firstId();
    state.currentId = first;
    if (first) console.info(`[control] seleccionado (auto): ${first}`);
    else console.warn("[control] no hay players registrados");
    return first;
  };
  ns.current = () => state.currentId || _firstId();

  // Sniper
  ns.capture = () => _mgr()?.sniper?.capture();
  ns.enableSniperLogging = (ms = 1000) => _mgr()?.sniper?.enableLogging(ms);
  ns.disableSniperLogging = () => _mgr()?.sniper?.disableLogging();

  // Playback
  ns.play = () => _mgr()?.play();
  ns.pause = () => _mgr()?.pause();
  ns.stop = () => _mgr()?.stop();
  ns.seek = (ms) => _mgr()?.seek(ms);
  ns.seekRel = (d) => _mgr()?.seekRel(d);
  ns.setVelocity = (v) => _mgr()?.setVelocity(v);
  ns.step = (dt) => _mgr()?.step(dt);

  // Blocks (nativos si existen; si no, shims mínimos)
  function hasHelper(mgr, name) { return typeof mgr?.[name] === "function"; }
  function deepCloneBlocks(mgr) {
    if (Array.isArray(mgr?._blocks)) return mgr._blocks.map(b => JSON.parse(JSON.stringify(b)));
    if (hasHelper(mgr, "listBlocks")) {
      const simple = mgr.listBlocks();
      return Array.isArray(simple) ? simple.map(b => ({ id: b.id, action: b.action, startMs: b.startMs, endMs: b.endMs, props: {} })) : [];
    }
    return [];
  }
  function shim_insertBlock(mgr, blk) {
    const blocks = deepCloneBlocks(mgr); blocks.push(blk);
    if (!hasHelper(mgr, "loadBlocks")) { console.warn("[control.shim] no loadBlocks()"); return { ok: false }; }
    mgr.loadBlocks(blocks); return { ok: true, id: blk.id };
  }
  function shim_removeBlock(mgr, id) {
    const blocks = deepCloneBlocks(mgr).filter(b => b.id !== id);
    if (!hasHelper(mgr, "loadBlocks")) { console.warn("[control.shim] no loadBlocks()"); return { ok: false }; }
    mgr.loadBlocks(blocks); return { ok: true };
  }
  function shim_setBlockProp(mgr, id, path, value) {
    const blocks = deepCloneBlocks(mgr);
    const blk = blocks.find(b => b.id === id);
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
    if (!hasHelper(mgr, "loadBlocks")) { console.warn("[control.shim] no loadBlocks()"); return { ok: false }; }
    mgr.loadBlocks(blocks);
    return { ok: true, block: { id: blk.id, action: blk.action, startMs: blk.startMs, endMs: blk.endMs } };
  }
  function shim_activateBlock(mgr, id, { play = false } = {}) {
    const blocks = deepCloneBlocks(mgr);
    const blk = blocks.find(b => b.id === id);
    if (!blk) return { ok: false, error: "no existe el bloque" };
    mgr.seek?.(blk.startMs || 0); if (play) mgr.play?.(); return { ok: true, tMs: mgr.getSnapshot?.().tMs ?? (blk.startMs || 0) };
  }
  function shim_skipCurrentBlock(mgr) {
    const snap = mgr.getSnapshot?.(); const t = snap?.tMs ?? 0;
    let blk = null;
    if (hasHelper(mgr, "getCurrentBlock")) blk = mgr.getCurrentBlock();
    else {
      const blocks = deepCloneBlocks(mgr);
      blk = blocks.find(b => t >= (b.startMs || 0) && (b.endMs == null ? true : t < b.endMs));
    }
    if (!blk) return { ok: false, error: "no hay bloque activo" };
    if (!Number.isFinite(blk.endMs)) return { ok: false, error: "bloque sin endMs" };
    mgr.seek?.(blk.endMs); return { ok: true, tMs: mgr.getSnapshot?.().tMs ?? blk.endMs };
  }
  function shim_jumpToNextTimeMs(mgr, deltaMs) {
    const d = Number(deltaMs); if (!Number.isFinite(d)) return { ok: false, error: "delta inválido" };
    if (mgr.seekRel) mgr.seekRel(Math.floor(d));
    else if (mgr.seek) { const t = mgr.getSnapshot?.().tMs ?? 0; mgr.seek(Math.max(0, t + Math.floor(d))); }
    return { ok: true, tMs: mgr.getSnapshot?.().tMs ?? null };
  }

  ns.getSnapshot = () => _mgr()?.getSnapshot();
  ns.listBlocks = () => _mgr()?.listBlocks?.() ?? deepCloneBlocks(_mgr()).map(b => ({ id: b.id, action: b.action, startMs: b.startMs, endMs: b.endMs }));

  ns.insertBlock = (blk) => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "insertBlock") ? m.insertBlock(blk) : shim_insertBlock(m, blk); };
  ns.removeBlock = (id) => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "removeBlock") ? m.removeBlock(id) : shim_removeBlock(m, id); };
  ns.setBlockProp = (id, path, value) => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "setBlockProp") ? m.setBlockProp(id, path, value) : shim_setBlockProp(m, id, path, value); };
  ns.activateBlock = (id, { play = false } = {}) => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "activateBlock") ? m.activateBlock(id, { play }) : shim_activateBlock(m, id, { play }); };
  ns.skipCurrentBlock = () => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "skipCurrentBlock") ? m.skipCurrentBlock() : shim_skipCurrentBlock(m); };
  ns.jumpToNextTimeMs = (deltaMs) => { const m = _mgr(); if (!m) return console.warn("[control] no manager"); return hasHelper(m, "jumpToNextTimeMs") ? m.jumpToNextTimeMs(deltaMs) : shim_jumpToNextTimeMs(m, deltaMs); };

  // Señales
  ns.signal = (type, payload) => _mgr()?.signal(type, payload);

  // Audio
  ns.mute = () => _mgr()?.mute();
  ns.unmute = () => _mgr()?.unmute();
  ns.toggleMute = () => _mgr()?.toggleMute();
  ns.unlockAudio = () => _mgr()?.unlockAudio();
  ns.setAudioPolicy = (p) => _mgr()?.setAudioPolicy?.(p);
  ns.audioStatus = () => {
    const m = _mgr();
    return m ? { muted: !!m.muted, audioUnlocked: !!m.audioUnlocked, pendingUnmute: !!m.pendingUnmute, policy: m.audioPolicy } : null;
  };

  console.info("[control] listo. Usa control.setAudioPolicy('unmuteOnInteract'|'manual'), control.unlockAudio(), control.unmute().");
})();
