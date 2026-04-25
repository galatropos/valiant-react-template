// scripts/upload.mjs
import "dotenv/config";
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs/promises";
import { selectFolderInteractive, BUILD_ROOT } from "./select_folder.mjs";

/* ===== ENV ===== */
const PROTOCOL = (process.env.UPLOAD_PROTOCOL || "http").trim();
const HOST = (process.env.UPLOAD_HOST || "").trim();
const START_URL = `${PROTOCOL}://${HOST}/`;
const USER = process.env.WP_USER || "";
const PASS = process.env.WP_PASS || "";
if (!HOST) throw new Error("Falta UPLOAD_HOST en .env");
if (!USER || !PASS) throw new Error("Faltan WP_USER / WP_PASS en .env");

/* ===== Selectores UI ===== */
const SEL_TAB_UPLOAD =
  "button.tablink[onclick*=\"openTab(event, 'Upload')\"], button.tablink[onclick*=\"openTab(event,'Upload')\"]";

const SEL_SUBMIT_BTN = 'button.box__button#submitUpload[type="submit"]';
const ALT_SUBMIT_BTNS = [SEL_SUBMIT_BTN, '#submitUpload', 'button.box__button', 'button[type="submit"]', 'input[type="submit"]'];

const SEL_MORE_UPLOAD = 'button#moreUpload[name="moreUpload"][type="button"]';
const ALT_MORE_UPLOADS = [SEL_MORE_UPLOAD, '#moreUpload', 'button[name="moreUpload"]'];

const SEL_NAME_INPUTS = 'input.box_name[name="iterationNameUpload"]';
const SEL_FILE_INPUTS = 'input[type="file"][name="fileUpload"]'; // tolerante a clones (id/class pueden repetirse)

/* ===== Helpers ===== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findInPageOrFrames(page, selectors) {
  const frames = [page.mainFrame(), ...page.frames()];
  for (const f of frames) {
    for (const sel of selectors) {
      try {
        const h = await f.$(sel);
        if (h) return { frame: f, handle: h, sel, where: f === page.mainFrame() ? "main" : (f.url() || "frame") };
      } catch {}
    }
  }
  return null;
}

async function trustedClick(page, frame, handle) {
  try { await handle.click({ delay: 10 }); return; } catch {}
  const box = await handle.boundingBox(); if (!box) return;
  const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
  await page.mouse.move(x, y, { steps: 6 }); await page.mouse.down(); await page.mouse.up();
}

async function ensureLoginScreen(page) {
  try { await page.waitForSelector('#user_login, input[name="log"]', { timeout: 4000 }); return; } catch {}
  try {
    await page.goto(`${PROTOCOL}://${HOST}/wp-login.php?redirect_to=%2F`, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch {
    const alt = PROTOCOL === "http" ? "https" : "http";
    await page.goto(`${alt}://${HOST}/wp-login.php?redirect_to=%2F`, { waitUntil: "domcontentloaded", timeout: 15000 });
  }
  await page.waitForSelector('#user_login, input[name="log"]', { timeout: 8000 });
}

async function maybeBypassInterstitial(page) {
  try {
    const title = await page.title();
    if (page.url().startsWith("chrome-error://") || /Your connection|HTTPS|no admite/i.test(title || "")) {
      const clicked = await page.evaluate(() => {
        const ids = ["#primary-button", "#proceed-button", "#proceed-link"];
        for (const sel of ids) {
          const el = document.querySelector(sel);
          if (el && el instanceof HTMLElement) { el.click(); return true; }
        }
        const btn = [...document.querySelectorAll("button,a")].find(b =>
          /continuar|continue to site|continue/i.test((b.textContent||"").trim())
        );
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!clicked) await page.keyboard.type("thisisunsafe");
      await sleep(500);
    }
  } catch {}
}

/** Rellena inputs de nombre en el frame dado con los valores names[] */
async function fillNameInputs(frame, names) {
  const deadline = Date.now() + 10000; // 10s
  let count = 0;
  while (Date.now() < deadline) {
    count = await frame.evaluate((sel) => document.querySelectorAll(sel).length, SEL_NAME_INPUTS);
    if (count >= names.length) break;
    await sleep(150);
  }
  if (count < names.length) {
    console.warn(`⚠️ Solo hay ${count} inputs de nombre, pero se necesitan ${names.length}. Se llenarán ${count}.`);
  }

  const filled = await frame.evaluate((nameSel, values) => {
    const inputs = Array.from(document.querySelectorAll(nameSel));
    const n = Math.min(inputs.length, values.length);
    for (let i = 0; i < n; i++) {
      const el = inputs[i];
      const v = values[i];
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && typeof desc.set === "function") desc.set.call(el, v); else el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return inputs.slice(0, values.length).map((el) => el.value);
  }, SEL_NAME_INPUTS, names);

  return filled;
}

/** Sube archivos en orden a los inputs file visibles en el frame */
async function fillFileInputs(frame, absPaths) {
  const deadline = Date.now() + 10000; // 10s
  let count = 0;
  while (Date.now() < deadline) {
    count = await frame.evaluate((sel) => document.querySelectorAll(sel).length, SEL_FILE_INPUTS);
    if (count >= absPaths.length) break;
    await sleep(150);
  }
  if (count < absPaths.length) {
    console.warn(`⚠️ Solo hay ${count} inputs file, pero se necesitan ${absPaths.length}. Se subirán ${count}.`);
  }

  const handles = await frame.$$(SEL_FILE_INPUTS);
  const n = Math.min(handles.length, absPaths.length);
  const results = [];

  for (let i = 0; i < n; i++) {
    const h = handles[i];
    const file = absPaths[i];
    try { await fs.access(file); } catch { results.push({ index: i, file, ok: false, reason: "no existe" }); continue; }
    await h.evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
    await h.uploadFile(file);
    const name = await frame.evaluate((el) => (el.files && el.files[0] ? el.files[0].name : null), h);
    results.push({ index: i, file, ok: !!name, selected: name || null });
  }

  return results;
}

/* ===== MAIN ===== */
(async () => {
  console.log("🚀 Preparar formulario: (N−1) clics, rellenar nombres, SUBIR archivos y CLICK en Upload");
  console.log("📦 BUILD_ROOT:", BUILD_ROOT);

  // 1) Selector → array de rutas RELATIVAS a Build
  const relFiles = await selectFolderInteractive(BUILD_ROOT);

  console.log("\n🧾 Resultado select_folder (array completo):");
  console.log(relFiles);
  if (!relFiles || relFiles.length === 0) {
    console.log("ℹ️ Arreglo vacío/cancelado. Fin.");
    return;
  }

  // 2) Derivar nombres (sin extensión) y rutas absolutas
  const absFiles = relFiles.map((rel) => path.resolve(BUILD_ROOT, rel));
  const names = absFiles.map((abs) => path.basename(abs, path.extname(abs)));

  console.log("\n🏷️ Nombres sin extensión a rellenar:");
  console.log(names);

  // 3) Abrir navegador + login + tab Upload
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    userDataDir: "./.pp-live-login",
    ignoreHTTPSErrors: true,
    defaultViewport: { width: 1366, height: 900 },
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--proxy-server=direct://","--proxy-bypass-list=*"],
  });
  const page = await browser.newPage();

  // Log liviano del host
  page.on("response", (res) => {
    const u = res.url();
    if (u.includes(HOST)) {
      const s = res.status();
      if (s >= 300 && s < 400) console.log(`🔁 ${s} ${u}`);
      else console.log(`🛰 ${s} ${u}`);
    }
  });

  try {
    await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    await maybeBypassInterstitial(page);

    await ensureLoginScreen(page);
    const onLogin = await page.$('#user_login, input[name="log"]');
    if (onLogin) {
      const frame = page.mainFrame();
      await frame.$eval('#user_login, input[name="log"]', (el, v) => { el.value = v; }, USER);
      await frame.$eval('#user_pass, input[name="pwd"]', (el, v) => { el.value = v; }, PASS);
      await page.$eval('#wp-submit, input[type="submit"][name="wp-submit"]', el => el instanceof HTMLElement && el.click());
      await page.waitForFunction(() => document.readyState === "complete" || document.readyState === "interactive", { timeout: 12000 }).catch(()=>{});
      console.log("🔓 Sesión activa.");
    }

    // Activar pestaña “Upload” si existe
    const tabBtn = await findInPageOrFrames(page, [SEL_TAB_UPLOAD]);
    if (tabBtn?.handle) {
      await trustedClick(page, tabBtn.frame, tabBtn.handle);
      await sleep(400);
    } else {
      console.log("ℹ️ No encontré el botón de pestaña 'Upload'; puede que ya esté activa.");
    }

    // 5) Clicks en “Add Another Upload”: (N−1) porque ya hay 1 bloque
    const moreBtn = await findInPageOrFrames(page, ALT_MORE_UPLOADS);
    let workingFrame = page.mainFrame();
    if (!moreBtn?.handle) {
      console.error("❌ No encontré el botón 'Add Another Upload' (#moreUpload). Continuaré con lo que exista en el DOM.");
    } else {
      workingFrame = moreBtn.frame || page.mainFrame();
      const clicks = Math.max(0, absFiles.length - 1);
      console.log(`➕ Dando ${clicks} clic(s) a 'Add Another Upload'...`);
      for (let i = 0; i < clicks; i++) {
        await moreBtn.handle.evaluate(el => el.scrollIntoView({ block: "center" })).catch(()=>{});
        await trustedClick(page, workingFrame, moreBtn.handle);
        await sleep(200);
      }
      console.log("✅ Clics completados.");
    }

    // 6) Rellenar los inputs de nombre
    const filledNames = await fillNameInputs(workingFrame, names);
    console.log("🧷 Nombres escritos en inputs:");
    console.log(filledNames);

    // 7) SUBIR archivos a los inputs file (en el mismo orden)
    const results = await fillFileInputs(workingFrame, absFiles);
    console.log("📎 Resultado de subir archivos (en orden):");
    console.table(results);

    // === AQUI: CLICK EN EL BOTÓN "Upload" ===
    {
      const submitBtn = await findInPageOrFrames(page, ALT_SUBMIT_BTNS);
      if (submitBtn?.handle) {
        // por si viene con disabled/aria-disabled en el HTML
        await submitBtn.handle.evaluate((el) => {
          el.removeAttribute("disabled");
          el.removeAttribute("aria-disabled");
          el.style.pointerEvents = "";
          el.style.opacity = "";
        }).catch(()=>{});

        await submitBtn.handle.evaluate(el => el.scrollIntoView({ block: "center" })).catch(()=>{});
        await trustedClick(page, submitBtn.frame || page.mainFrame(), submitBtn.handle);
        console.log("🚀 Click en botón Upload.");
      } else {
        console.error("❌ No encontré el botón Upload (#submitUpload).");
      }
    }

    // Mantener abierto para revisar
    await new Promise(() => {}); 
  } catch (err) {
    console.error("❌ Error:", err.stack || err.message);
    console.log("🔵 Dejo el navegador abierto para inspección.");
    await new Promise(() => {});
  }
})();
