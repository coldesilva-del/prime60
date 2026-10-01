// Generates PWA icons from an inline HTML template using Playwright's Chromium.
// Run: node scripts/make-icons.mjs
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const out = path.resolve("public/icons");
await mkdir(out, { recursive: true });

const html = (size, { maskable = false } = {}) => `<!doctype html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=Instrument+Sans:wght@500&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;background:transparent}
  .icon{width:${size}px;height:${size}px;background:#141a21;border-radius:${maskable ? 0 : Math.round(size * 0.22)}px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Newsreader',Georgia,serif}
  .num{color:#d4b57a;font-size:${Math.round(size * (maskable ? 0.46 : 0.56))}px;line-height:1;letter-spacing:-0.03em;font-weight:500;
    font-variation-settings:'opsz' 72}
  .word{color:#a4acb6;font-family:'Instrument Sans',sans-serif;font-size:${Math.round(size * 0.11)}px;letter-spacing:0.06em;margin-top:${Math.round(size * 0.02)}px}
</style></head>
<body><div class="icon"><div class="num">60</div><div class="word">Prime</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-512-maskable.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(html(t.size, { maskable: t.maskable }), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, t.file), omitBackground: !t.maskable, clip: { x: 0, y: 0, width: t.size, height: t.size } });
  console.log("wrote", t.file);
}

await browser.close();
