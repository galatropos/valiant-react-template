// src/component/video/blocks.js
// 🧱 Paso 3 — utilidades para cargar y normalizar blocks[].
// Cada bloque describe algo que pasa en un rango de tiempo: [startMs, endMs).
// Estructura normalizada de un bloque:
// { id: string, action: string, startMs: number, endMs: number|null, props: object }

let __blkAutoId = 0;
const genId = () => `blk_${(++__blkAutoId).toString(36)}`;

/** Normaliza un número ms (>=0). Si no es válido, devuelve 0. */
function normMs(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** Valida y normaliza un bloque; devuelve { ok, block?, errors[] } */
export function normalizeBlock(raw) {
  const errors = [];
  if (raw == null || typeof raw !== "object") {
    return { ok: false, errors: ["Block no es un objeto"] };
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : genId();
  const action = typeof raw.action === "string" && raw.action.trim() ? raw.action.trim() : "noop";

  const hasStart = raw.startMs != null;
  const hasEnd = raw.endMs != null;

  const startMs = hasStart ? normMs(raw.startMs) : 0;
  const endMs = hasEnd ? normMs(raw.endMs) : null;

  if (!hasStart) errors.push("startMs faltante (se asumió 0)");
  if (endMs != null && endMs <= startMs) errors.push("endMs debe ser > startMs o null");

  const props = (raw.props && typeof raw.props === "object") ? { ...raw.props } : {};
  const block = { id, action, startMs, endMs, props };

  return { ok: errors.length === 0, block, errors };
}

/** Normaliza una lista completa de bloques. */
export function normalizeBlocks(list) {
  const out = [];
  const errors = [];
  if (!Array.isArray(list)) return { blocks: out, errors: ["blocks no es un array"] };

  for (const item of list) {
    const res = normalizeBlock(item);
    if (res.ok) out.push(res.block);
    if (res.errors?.length) errors.push({ item, errors: res.errors });
  }
  return { blocks: out, errors };
}

/** Orden estable: startMs asc, endMs asc (null al final), luego id asc. */
export function sortBlocks(blocks) {
  return [...blocks].sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs;
    const ae = a.endMs == null ? Infinity : a.endMs;
    const be = b.endMs == null ? Infinity : b.endMs;
    if (ae !== be) return ae - be;
    return String(a.id).localeCompare(String(b.id));
  });
}

/** Lista simplificada para consola/devtools. */
export function summarizeBlocks(blocks) {
  return blocks.map(b => ({
    id: b.id,
    action: b.action,
    startMs: b.startMs,
    endMs: b.endMs,
    // tip: agrega aquí campos calculados si luego los necesitas
  }));
}
