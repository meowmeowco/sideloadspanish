/**
 * Capture promo tiles for Chrome Web Store.
 * Run: node scripts/take-tiles.js
 */
import { chromium } from 'playwright';
import path from 'path';

const STORE_DIR = path.resolve(import.meta.dirname, '..', 'store');
const SCRIPTS_DIR = path.resolve(import.meta.dirname);

const tiles = [
  { file: 'make-promo-tile.html', out: 'promo-small-440x280.png', w: 440, h: 280 },
  { file: 'make-marquee-tile.html', out: 'promo-marquee-1400x560.png', w: 1400, h: 560 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const tile of tiles) {
    const page = await browser.newPage({ viewport: { width: tile.w, height: tile.h } });
    await page.goto(`file://${path.join(SCRIPTS_DIR, tile.file)}`);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(STORE_DIR, tile.out),
      fullPage: false,
      type: 'png',
    });
    await page.close();
    console.log(`${tile.out} — done`);
  }

  await browser.close();
  console.log(`\nTiles saved to ${STORE_DIR}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
