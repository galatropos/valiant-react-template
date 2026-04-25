// scripts/finish-all.mjs
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const APP_PATH = path.join(root, "src", "App.jsx");
const DIST_PATH = path.join(root, "dist");
const WAIT_MS = 300;
const BASE_OUTPUT_DIR = path.join(root, "Build");

const read = (p) => fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
const write = (p, s) => fs.writeFileSync(p, s, "utf8");
const die = (m) => { console.error("[finish-all] " + m); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(`[finish-all] ${m}`);

function run(cmd) {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

function resolveImport(baseFile, rawImport) {
  const baseDir = path.dirname(baseFile);
  const abs = path.resolve(baseDir, rawImport);
  const candidates = [
    abs, abs + ".jsx", abs + ".js",
    path.join(abs, "Index.jsx"),
    path.join(abs, "index.jsx"),
    path.join(abs, "Index.js"),
    path.join(abs, "index.js"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function parseLineWithOptionalSubdir(line) {
  // Último token = alias/rutaImport. Lo demás (con espacios) = "subdir/filename" o "filename"
  const trimmed = line.trim().replace(/\\/g, "/"); // normaliza backslashes
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;

  const aliasOrImport = parts[parts.length - 1];
  const left = trimmed.slice(0, trimmed.lastIndexOf(aliasOrImport)).trim();
  if (!left) return null;

  let subdir = "";
  let file = left;
  const slashIdx = left.lastIndexOf("/");
  if (slashIdx !== -1) {
    subdir = left.slice(0, slashIdx).trim(); // puede tener espacios
    file = left.slice(slashIdx + 1).trim();
  }

  // Sanitiza subdir para evitar salir del proyecto
  if (subdir.includes("..")) die(`Subcarpeta inválida (..): "${subdir}"`);

  return { subdir, file, aliasOrImport };
}

async function main() {
  // 1) Import de la PRIMERA línea de src/App.jsx
  if (!fs.existsSync(APP_PATH)) die(`No existe: ${path.relative(root, APP_PATH)}`);
  const appContent = read(APP_PATH);
  const firstLine = appContent.split(/\r?\n/)[0]?.trim() ?? "";
  const m = firstLine.match(/\bfrom\s+["']([^"']+)["']/);
  if (!m) die(`La primera línea no tiene 'from "...":' → ${firstLine}`);
  const importRaw = m[1];
  log(`Primera línea App.jsx: ${firstLine}`);
  log(`Import detectado: ${importRaw}`);

  // 2) Archivo destino
  const targetPath = resolveImport(APP_PATH, importRaw);
  if (!targetPath) die(`No pude resolver el import: ${importRaw}`);
  log(`Archivo destino: ${path.relative(root, targetPath)}`);

  // 3) Parsear bloque /* ... */ → folder + items (con subcarpetas opcionales)
  const targetOriginalContent = read(targetPath);
  const block = targetOriginalContent.match(/\/\*([\s\S]*?)\*\//);
  if (!block) die("No se encontró bloque /* ... */ en el archivo destino.");
  const lines = block[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) die("Bloque /* ... */ vacío.");

  const folder = lines[0].split(/\s+/)[0];
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseLineWithOptionalSubdir(lines[i]);
    if (!parsed) { console.warn(`[finish-all] Línea ignorada: ${lines[i]}`); continue; }
    const { subdir, file, aliasOrImport } = parsed;

    const looksLikePath = /^(?:\.\/|\/|src\/)/.test(aliasOrImport);
    const importPath = looksLikePath ? aliasOrImport : `./src/component/${aliasOrImport}/Index`;
    items.push({ subdir, file, importPath });
  }

  log(`folder: ${folder}`);
  log(`items (${items.length}): ${items.map(i => (i.subdir? i.subdir + "/" : "") + i.file).join(", ")}`);

  // 4) Asegurar Build/<folder>
  ensureDir(BASE_OUTPUT_DIR);
  const batchDir = path.join(BASE_OUTPUT_DIR, folder);
  ensureDir(batchDir);
  const resolvedBatch = path.resolve(batchDir);
  if (!resolvedBatch.startsWith(root + path.sep)) die(`Carpeta de salida inválida: ${batchDir}`);
  log(`Salida base: ${path.relative(root, resolvedBatch)}`);

  // 5) Regex import Sip y backup
  const importRegex = /^[ \t]*import\s+Sip\s+from\s+["'][^"']+["'];?/m;
  if (!importRegex.test(targetOriginalContent)) {
    die(`No se encontró la línea 'import Sip from "..."' en ${path.relative(root, targetPath)}`);
  }
  const originalImportLine = (targetOriginalContent.match(importRegex) || [])[0] || null;
  const targetBackup = targetOriginalContent;

  try {
    // 6) Iterar y construir
    for (let idx = 0; idx < items.length; idx++) {
      const { subdir, file, importPath } = items[idx];
      const newImportLine = `import Sip from "${importPath}";`;
      const idxMsg = `(${idx + 1}/${items.length})`;

      // 6.1) Escribir
      log(`${idxMsg} Escribiendo → ${newImportLine}`);
      const nextContent = targetOriginalContent.replace(importRegex, newImportLine);
      write(targetPath, nextContent);

      // 6.2) Esperar (opcional)
      log(`${idxMsg} Esperando guardado...`);
      await sleep(WAIT_MS);

      // 6.3) Verificar
      const verify = read(targetPath);
      if (!verify.includes(newImportLine)) { console.error(`${idxMsg} ERROR al guardar`); continue; }
      log(`${idxMsg} Guardado ✓`);

      // 6.4) Build
      try {
        log(`${idxMsg} Construyendo (npm run build)…`);
        run(`npm run build`);
      } catch {
        console.error(`${idxMsg} ERROR en build, continúo con el siguiente`);
        continue;
      }

      // 6.5) Determinar carpeta destino del ítem: Build/<folder>/<subdir?>
      const itemDir = subdir ? path.join(resolvedBatch, subdir) : resolvedBatch;
      ensureDir(itemDir);
      const resolvedItemDir = path.resolve(itemDir);
      if (!resolvedItemDir.startsWith(resolvedBatch)) {
        console.warn(`${idxMsg} Subcarpeta fuera de alcance: ${itemDir}. Salto.`);
        continue;
      }

      // 6.6) Copiar dist/* → itemDir
      const distRoot = DIST_PATH;
      const rootIndex = path.join(distRoot, "index.html");
      if (!fs.existsSync(rootIndex)) {
        console.warn(`${idxMsg} WARN: no se encontró dist/index.html; salto copia`);
        continue;
      }

      const rootEntries = fs.readdirSync(distRoot, { withFileTypes: true });
      for (const entry of rootEntries) {
        const from = path.join(distRoot, entry.name);
        const to = path.join(resolvedItemDir, entry.name);
        if (entry.isDirectory()) {
          fs.cpSync(from, to, { recursive: true });
        } else {
          fs.copyFileSync(from, to);
        }
      }

      // 6.7) Renombrar index.html → <file>.html en la subcarpeta correspondiente
      const finalIndex = path.join(resolvedItemDir, "index.html");
      const renamed = path.join(resolvedItemDir, `${file}.html`);
      if (fs.existsSync(finalIndex)) {
        if (fs.existsSync(renamed)) fs.rmSync(renamed);
        fs.renameSync(finalIndex, renamed);
        log(`${idxMsg} Renombrado ${path.relative(root, finalIndex)} → ${file}.html`);
      } else {
        console.warn(`${idxMsg} WARN: no se encontró index.html en ${path.relative(root, resolvedItemDir)}`);
      }

      log(`${idxMsg} Listo ✓ → ${path.relative(root, resolvedItemDir)}/${file}.html`);
    }
  } finally {
    // 7) Restaurar import original
    if (originalImportLine) {
      const restored = read(targetPath).replace(importRegex, originalImportLine);
      write(targetPath, restored);
      log(`Import restaurado a valor original`);
    } else {
      write(targetPath, targetBackup);
      log(`Archivo destino restaurado desde backup`);
    }
  }

  log(`✅ Proceso terminado. Revisa: ${path.relative(root, resolvedBatch)}/`);
}

await main().catch((e) => { console.error(e); process.exit(1); });
