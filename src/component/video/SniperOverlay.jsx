// src/component/video/SniperOverlay.jsx
import React, { useEffect, useState, useRef } from "react";

export default function SniperOverlay({ manager, instanceId }) {
  const [snap, setSnap] = useState(null);
  const [seekMs, setSeekMs] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!manager) return;
    const id = setInterval(() => {
      try { setSnap(manager.getSnapshot()); } catch {}
    }, 300);
    return () => clearInterval(id);
  }, [manager]);

  if (!manager) return null;

  const panel = {
    position:"absolute",
    right:8, top:8, zIndex: 4000, // alto para estar encima del canvas
    width: 280, maxWidth: "80%",
    color:"#fff",
    background:"rgba(0,0,0,0.60)",
    border:"1px solid rgba(255,255,255,0.18)",
    borderRadius:10,
    padding:10,
    fontSize:12,
    lineHeight:1.2,
    backdropFilter:"blur(3px)",
    userSelect:"none",
    pointerEvents:"auto",          // <- recibe clics
  };
  const header = { marginBottom:8, fontWeight:600, display:"flex", justifyContent:"space-between", alignItems:"center" };
  const btn = {
    padding: "4px 8px",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 6,
    background: "rgba(0,0,0,0.2)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    marginRight: 6,
  };
  const row = (k, v) => (
    <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
      <div style={{ opacity:0.7 }}>{k}</div>
      <div style={{ fontFamily:"monospace" }}>{v}</div>
    </div>
  );

  const doSeek = (ms) => {
    const v = Number(ms);
    if (Number.isFinite(v)) {
      manager.seek(Math.max(0, Math.floor(v)));
    }
  };

  return (
    <div style={panel} onPointerDown={e => e.stopPropagation()}>
      <div style={header}>
        <span>Sniper • {instanceId}</span>
        <button
          style={{...btn, marginRight:0}}
          onClick={() => {
            try { manager.sniper?.enableLogging(500); } catch {}
            setTimeout(() => manager.sniper?.disableLogging(), 3000);
          }}
          title="Log snapshot cada 500ms por 3s"
        >
          Log 3s
        </button>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        <button style={btn} onClick={() => doSeek((manager.getSnapshot()?.tMs||0)-1000)}>⏪ -1s</button>
        <button style={btn} onClick={() => doSeek((manager.getSnapshot()?.tMs||0)+1000)}>⏩ +1s</button>
        <button style={btn} onClick={() => manager.play()}>▶️ Play</button>
        <button style={btn} onClick={() => manager.pause()}>⏸️ Pause</button>
        <button style={btn} onClick={() => manager.stop()}>⏹️ Stop</button>
        <button style={btn} onClick={() => manager.setVelocity(0.5)}>0.5x</button>
        <button style={btn} onClick={() => manager.setVelocity(1)}>1x</button>
        <button style={btn} onClick={() => manager.setVelocity(2)}>2x</button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        <input
          ref={inputRef}
          value={seekMs}
          onChange={e => setSeekMs(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { doSeek(seekMs); inputRef.current?.blur(); } }}
          placeholder="seek (ms)"
          inputMode="numeric"
          style={{
            flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid rgba(255,255,255,0.25)",
            background:"rgba(0,0,0,0.25)", color:"#fff", fontSize:12
          }}
        />
        <button style={btn} onClick={() => doSeek(seekMs)}>Ir</button>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        <button style={btn} onClick={() => manager.mute()}>🔇 Mute</button>
        <button style={btn} onClick={() => manager.unmute()}>🔊 Unmute</button>
        <button style={btn} onClick={() => manager.signal("user.audioGesture")}>🔓 Unlock</button>
      </div>

      {snap ? (
        <div style={{ display:"grid", gap:6 }}>
          {row("tMs", snap.tMs)}
          {row("state", snap.state)}
          {row("vel (eff/base)", `${snap.velocity} / ${snap.baseVelocity}`)}
          {row("durationMs", snap.durationMs ?? "—")}
          {row("muted/unlocked", `${snap.muted}/${snap.audioUnlocked}`)}
          {row("driftMs", snap.video?.driftMs ?? 0)}
          {row("blocks (active/total)", `${snap.blocks?.activeCount}/${snap.blocks?.count}`)}
          {row("clock", `${snap.clock?.type} (dt≈${Math.round(snap.clock?.lastDtMs||0)}ms)`)}
        </div>
      ) : (
        <div>loading…</div>
      )}
    </div>
  );
}
