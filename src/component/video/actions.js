// src/component/video/actions.js
// Paso 5+6 (existente) + Paso 7 (holdToPlay / holdToPause)

export function onBlockEnter(manager, block) {
    const { action, id, props = {} } = block;
  
    switch (action) {
      // ======== BÁSICAS (igual que antes) ========
      case "visible": {
        const target = props.target ?? id;
        manager._visibleTargets.add(String(target));
        break;
      }
      case "velocity": {
        const mult = Number(props.multiplier ?? props.value ?? 1);
        if (Number.isFinite(mult) && mult > 0) {
          manager._velStack.push({ id, mult });
          manager._recomputeEffectiveVelocity();
        }
        break;
      }
      case "addImg": {
        const key = props.key ?? id;
        manager._overlays.add(String(key));
        if (props.pauseOnEnter) { manager._pausedByBlocks.add(id); manager.pause(); }
        break;
      }
      case "addVideo": {
        manager._videoLayer = {
          blockId: id,
          loop: !!props.loop,
          freezeOnExit: props.freezeOnExit !== false,
          props: { ...props },
        };
        break;
      }
  
      // ======== CONTROL (igual que antes) ========
      case "pause": {
        manager._pausedByBlocks.add(id); manager.pause();
        const resumeToMs =
          Number.isFinite(props.resumeToMs) ? props.resumeToMs :
          Number.isFinite(block.endMs) ? block.endMs : manager.currentMs;
        manager._pauseResumeMap.set(id, { resumeToMs, autoResume: !!props.autoResume });
        break;
      }
      case "seek": {
        const toMs = Number(props.toMs);
        if (Number.isFinite(toMs)) { manager._markProgrammaticSeek(); manager.seek(toMs); }
        break;
      }
      case "next": {
        const jumpToMs =
          Number.isFinite(props.jumpToMs) ? props.jumpToMs :
          Number.isFinite(block.endMs) ? block.endMs : manager.currentMs;
        const playOnNext = props.playOnNext !== false;
        manager.pause();
        manager._awaitingNext = { blockId: id, jumpToMs, playOnNext };
        break;
      }
      case "loopRange": {
        const times = Number(props.times);
        const infinite = props.infinite === true || !Number.isFinite(times);
        const max = infinite ? Infinity : Math.max(0, Math.floor(times));
        manager._loopRanges.set(id, {
          id,
          startMs: block.startMs,
          endMs: Number.isFinite(block.endMs) ? block.endMs : block.startMs,
          count: 0,
          max,
          coolDownMs: Number.isFinite(props.coolDownMs) ? props.coolDownMs : 16,
        });
        break;
      }
  
      // ======== PASO 7: HOLD GESTURES ========
      case "holdToPlay": {
        // Entra pausado; con el hold avanza y, si cruza endMs, termina.
        manager.pause();
        manager._holds.set(id, {
          type: "holdToPlay",
          blockId: id,
          startMs: block.startMs,
          endMs: Number.isFinite(block.endMs) ? block.endMs : Infinity,
          enterMs: manager.currentMs, // punto de entrada real
          pressActive: false,
          pressStartedAt: 0,
          pressThresholdMs: Number.isFinite(props.pressThresholdMs) ? props.pressThresholdMs : 0,
          velocityWhileHold: Number.isFinite(props.velocityWhileHold) ? props.velocityWhileHold : 1,
          revertTo: props.revertTo === "start" ? "start" : "enter", // "start"|"enter"
          outsideRelease: props.outsideRelease === "revert" ? "revert" : "ignore",
        });
        break;
      }
  
      case "holdToPause": {
        // Entra reproduciendo; con el hold pausa, al soltar reanuda.
        manager.play();
        manager._holds.set(id, {
          type: "holdToPause",
          blockId: id,
          startMs: block.startMs,
          endMs: Number.isFinite(block.endMs) ? block.endMs : Infinity,
          enterMs: manager.currentMs,
          pressActive: false,
          pressStartedAt: 0,
          pressThresholdMs: Number.isFinite(props.pressThresholdMs) ? props.pressThresholdMs : 0,
          outsideRelease: props.outsideRelease === "keepPaused" ? "keepPaused" : "resume",
        });
        break;
      }
  
      default: break;
    }
  }
  
  export function onBlockExit(manager, block) {
    const { action, id } = block;
  
    switch (action) {
      // ======== BÁSICAS ========
      case "visible": {
        const target = block.props?.target ?? id;
        manager._visibleTargets.delete(String(target));
        break;
      }
      case "velocity": {
        const idx = manager._velStack.findLastIndex((x) => x.id === id);
        if (idx >= 0) manager._velStack.splice(idx, 1);
        manager._recomputeEffectiveVelocity();
        break;
      }
      case "addImg": {
        const key = block.props?.key ?? id;
        manager._overlays.delete(String(key));
        if (manager._pausedByBlocks.has(id)) { manager._pausedByBlocks.delete(id); manager.play(); }
        break;
      }
      case "addVideo": {
        if (manager._videoLayer?.blockId === id) {
          const freeze = manager._videoLayer.freezeOnExit !== false;
          if (freeze && Number.isFinite(block.endMs)) { manager.seek(block.endMs); manager.pause(); }
          manager._videoLayer = null;
        }
        break;
      }
  
      // ======== CONTROL ========
      case "pause": {
        const cfg = manager._pauseResumeMap.get(id);
        if (cfg) {
          manager._pauseResumeMap.delete(id);
          manager._pausedByBlocks.delete(id);
          if (cfg.autoResume) {
            const resume = () => { manager._markProgrammaticSeek(); manager.seek(cfg.resumeToMs); manager.play(); };
            if (typeof queueMicrotask === "function") queueMicrotask(resume); else setTimeout(resume, 0);
          }
        } else {
          manager._pausedByBlocks.delete(id);
        }
        break;
      }
      case "next": {
        if (manager._awaitingNext?.blockId === id) manager._awaitingNext = null;
        break;
      }
      case "loopRange": {
        const rec = manager._loopRanges.get(id);
        if (rec) {
          rec.count += 1;
          if (rec.count < rec.max) {
            manager._markProgrammaticSeek(); manager.seek(rec.startMs);
            manager._programmaticCooldownUntil = performance.now() + rec.coolDownMs;
          } else {
            manager._loopRanges.delete(id);
          }
        }
        break;
      }
  
      // ======== PASO 7: HOLD GESTURES ========
      case "holdToPlay": {
        // limpiar estado y quitar multiplicador si estaba activo
        manager._endHoldVelocity(id);
        manager._holds.delete(id);
        break;
      }
      case "holdToPause": {
        manager._holds.delete(id);
        break;
      }
  
      default: break;
    }
  }
  