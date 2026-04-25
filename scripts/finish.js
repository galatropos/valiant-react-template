// scripts/upload.cjs (CommonJS)
require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('node:fs/promises');
const path = require('node:path');

const args = Object.fromEntries(
  process.argv.slice(2).map(s => s.replace(/^--/, '')).map(kv => {
    const [k, ...rest] = kv.split('=');
    return [k, rest.length ? rest.join('=') : true];
  })
);

const cfg = {
  url: args.url || process.env.TARGET_URL || 'http://localhost:3000/',
  upload: args.upload || process.env.UPLOAD_PAGE || null,
  file: args.file || process.env.FILE_TO_UPLOAD || '',
  input: args.input || process.env.FILE_INPUT_SELECTOR || 'input[type="file"]',
  submit: args.submit || process.env.SUBMIT_SELECTOR || 'button[type="submit"], [data-action="upload"]',
  headful: !!args.headful,
  slowmo: Number(args.slowmo || 0),
};

if (!cfg.file) { console.error('❌ Define FILE_TO_UPLOAD o --file='); process.exit(1); }
const absFile = path.resolve(process.cwd(), cfg.file);
await fs.access(absFile).catch(() => { console.error('❌ No existe:', absFile); process.exit(1); });

const browser = await puppeteer.launch({
  headless: !cfg.headful,
  slowMo: cfg.slowmo,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.goto(cfg.url, { waitUntil: 'domcontentloaded' });
  if (cfg.upload && cfg.upload !== cfg.url) {
    await page.goto(cfg.upload, { waitUntil: 'domcontentloaded' });
  }
  const input = await page.$(cfg.input);
  if (input) await input.uploadFile(absFile);
  else {
    const triggerSel = args.trigger || process.env.TRIGGER_SELECTOR || 'button, .btn, [role="button"]';
    const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), page.click(triggerSel)]);
    await chooser.accept([absFile]);
  }
  const submit = await page.$(cfg.submit);
  if (submit) {
    await Promise.all([page.click(cfg.submit), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => Promise.resolve())]);
  }
  console.log('✅ Upload ejecutado.');
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
