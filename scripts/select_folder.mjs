// scripts/select_folder.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Lee raíz Build desde .env (default: <proyecto>/Build)
const envRoot = (process.env.UPLOAD_BUILD_ROOT || "Build").trim();
export const BUILD_ROOT = path.isAbsolute(envRoot)
  ? envRoot
  : path.resolve(projectRoot, envRoot);

async function assertDirExists(dir) {
  const st = await fs.stat(dir).catch(() => null);
  if (!st || !st.isDirectory()) {
    throw new Error(`No existe la carpeta: ${dir}`);
  }
}

async function getSubdirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
}

async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Navega exclusivamente bajo BUILD_ROOT y retorna un array de rutas
 * RELATIVAS a BUILD_ROOT (sin prefijo "Build"), p.ej.:
 *   ["gioTest.html", "subcarpeta/otro.html"]
 *
 * Flujo:
 * - En raíz NO aparece opción 0.
 * - 0 = regresar (cuando NO estás en raíz).
 * - Si entras a una carpeta sin subcarpetas:
 *     - Lista los archivos.
 *     - Pregunta confirmación.
 *     - "s" => retorna array relativo a Build.
 *     - "n" => regresa; si estás en raíz y "n", retorna [].
 */
export async function selectFolderInteractive(rootDir = BUILD_ROOT) {
  await assertDirExists(rootDir);
  const rl = readline.createInterface({ input, output });
  const stack = [path.resolve(rootDir)];

  try {
    while (true) {
      const current = stack[stack.length - 1];
      const subdirs = await getSubdirs(current);

      if (subdirs.length === 0) {
        const files = await getFiles(current);

        console.log("\n✅ Carpeta final (sin subcarpetas):");
        console.log(current);
        if (files.length === 0) {
          console.log("⚠️  No hay archivos en esta carpeta.");
        } else {
          console.log("📄 Archivos:");
          files.forEach((f) => console.log(" -", f));
        }

        let answer = await rl.question(
          "\n¿Estás seguro de subir estos archivos? (s/n): "
        );
        answer = (answer || "").trim().toLowerCase();

        if (answer === "s") {
          const relDirFromBuild = path.relative(BUILD_ROOT, current); // "" si raíz
          const pathsFromBuild = files.map((f) =>
            relDirFromBuild ? `${relDirFromBuild}/${f}` : `${f}`
          );
          // Retornamos SIN imprimir
          return pathsFromBuild;
        } else {
          if (stack.length > 1) {
            stack.pop();
            continue;
          } else {
            // En raíz y cancela => []
            return [];
          }
        }
      }

      // Mostrar menú
      const atRoot = current === path.resolve(BUILD_ROOT);
      console.log("\n📁 Carpeta actual:");
      console.log(current);
      console.log("\nSelecciona una carpeta:");
      subdirs.forEach((name, idx) => console.log(`  ${idx + 1}. ${name}`));
      if (!atRoot) console.log("  0. ⬅️  Regresar");

      const answer = await rl.question("\nIngresa número: ");
      const choice = Number.parseInt(answer, 10);

      if (!Number.isFinite(choice)) {
        console.log("❌ Opción inválida.");
        continue;
      }

      if (!atRoot && choice === 0) {
        if (stack.length > 1) stack.pop();
        continue;
      }

      if (choice < 1 || choice > subdirs.length) {
        console.log("❌ Opción inválida.");
        continue;
      }

      const selectedName = subdirs[choice - 1];
      const nextPath = path.resolve(current, selectedName);
      stack.push(nextPath);
    }
  } finally {
    rl.close();
  }
}

/** Devuelve el listado simple de la raíz Build (por si lo necesitas en CLI) */
export async function listBuildRoot(dir = BUILD_ROOT) {
  await assertDirExists(dir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.map((d) => d.name).sort((a, b) => a.localeCompare(b));
}

// CLI opcional: `npm run select` para abrir el selector.
// Tip: puedes agregar un flag --json si quisieras imprimir el array en stdout, pero
// tu flujo actual lo importa desde upload.mjs, así que no imprimimos nada aquí.
const isCLI = path.resolve(process.argv[1] || "") === path.resolve(__filename);
if (isCLI) {
  const customStart = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : BUILD_ROOT;

  await (async () => {
    try {
      await selectFolderInteractive(customStart);
    } catch (e) {
      console.error("[select_folder] Error:", e.message);
      process.exit(1);
    }
  })();
}
