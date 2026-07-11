/* Re-photograph the five live brand sites and refresh the specimen images.
   The home page shows real screenshots, not live embeds (the brand sites
   send frame-ancestors policies that block iframes), so run this whenever
   a site changes and commit the result:

     npm install
     node scripts/refresh-specimens.mjs
     git add assets/specimens && git commit -m "Refresh specimens" && git push

   Requires Google Chrome at the default macOS path. */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'specimens');
fs.mkdirSync(OUT, { recursive: true });

const SITES = [
  { url: 'https://andthentheycreateus.com', file: 'attcu.jpg' },
  { url: 'https://sometimesaesthetic.tools', file: 'sat.jpg' },
  { url: 'https://epistemicnet.com', file: 'en.jpg' },
  { url: 'https://theretinue.co', file: 'retinue.jpg' },
  { url: 'https://www.wecreatetools.com', file: 'wct.jpg' },
];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

for (const site of SITES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(site.url, { waitUntil: 'load', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));
    /* dismiss common consent overlays if present */
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('[class*="cookie" i], [id*="cookie" i], [class*="consent" i]')) {
        if (el.getBoundingClientRect().height > 40) el.remove();
      }
    });
    await page.screenshot({ path: path.join(OUT, site.file), type: 'jpeg', quality: 76 });
    console.log('ok', site.file);
  } catch (e) {
    console.error('FAILED (kept previous image)', site.file, e.message);
  }
  await page.close();
}

/* the SAT detail crop comes from the fresh SAT capture */
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://sometimesaesthetic.tools', { waitUntil: 'load', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({
    path: path.join(OUT, 'sat-2.jpg'),
    type: 'jpeg', quality: 80,
    clip: { x: 60, y: 80, width: 780, height: 487 },
  });
  console.log('ok sat-2.jpg');
  await page.close();
} catch (e) {
  console.error('FAILED (kept previous image) sat-2.jpg', e.message);
}

await browser.close();
