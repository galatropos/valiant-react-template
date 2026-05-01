// scripts/pending.mjs
import "dotenv/config";
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs/promises";
import { selectFolderInteractive, BUILD_ROOT } from "./select_folder.mjs";

const DRIVE_FOLDER_URL =
  process.env.PENDING_DRIVE_FOLDER_URL ||
  "https://drive.google.com/drive/u/0/folders/1XbjJbHIcghucaXSDmTLSlsKw19Bmhs42";

const USER_DATA_DIR = "./.pp-google-drive-pending";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function assertFilesExist(files) {
  for (const file of files) {
    await fs.access(file);
  }
}

async function waitUntilDriveReady(page) {
  console.log("⏳ Esperando que Google Drive esté listo...");

  await page.waitForFunction(
    () => {
      return Boolean(
        document.querySelector('button[guidedhelpid="new_menu_button"]') ||
          document.querySelector('button[aria-label="New"]') ||
          document.querySelector('button[aria-label="Nuevo"]')
      );
    },
    {
      timeout: 0,
    }
  );

  console.log("✅ Google Drive listo.");
}

async function openFileUploadWithKeyboard(page) {
  const fileChooserPromise = page.waitForFileChooser({
    timeout: 15000,
  });

  await page.keyboard.down("Alt");
  await page.keyboard.press("KeyC");
  await page.keyboard.up("Alt");

  await sleep(700);

  await page.keyboard.press("KeyU");

  return await fileChooserPromise;
}

async function main() {
  console.log("🚀 Seleccionar archivos y subir a Google Drive / pending");
  console.log("📦 BUILD_ROOT:", BUILD_ROOT);
  console.log("📁 Drive URL:", DRIVE_FOLDER_URL);

  const relFiles = await selectFolderInteractive(BUILD_ROOT);

  console.log("\n🧾 Archivos seleccionados:");
  console.log(relFiles);

  if (!relFiles || relFiles.length === 0) {
    console.log("ℹ️ No seleccionaste archivos. Fin.");
    return;
  }

  const absFiles = relFiles.map((rel) => path.resolve(BUILD_ROOT, rel));
  await assertFilesExist(absFiles);

  console.log("\n📎 Archivos que se van a subir:");
  absFiles.forEach((file) => console.log(" -", file));

  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    userDataDir: USER_DATA_DIR,
    defaultViewport: { width: 1366, height: 900 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--start-maximized",
    ],
  });

  const page = await browser.newPage();

  try {
    await page.goto(DRIVE_FOLDER_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("\n✅ Google Drive abierto.");

    await page.bringToFront();

    await waitUntilDriveReady(page);

    await sleep(1000);

    const fileChooser = await openFileUploadWithKeyboard(page);

    await fileChooser.accept(absFiles);

    console.log("\n🚀 Archivos enviados a Google Drive.");
    console.log("⏳ Espera a que Google Drive termine la subida.");
    console.log("🔵 Dejo el navegador abierto para revisar.");

    await new Promise(() => {});
  } catch (err) {
    console.error("\n❌ Error:", err.stack || err.message);
    console.log("🔵 Dejo el navegador abierto para inspección.");
    await new Promise(() => {});
  }
}

main();