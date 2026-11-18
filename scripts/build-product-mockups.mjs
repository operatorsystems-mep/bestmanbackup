/**
 * Build site mockups from product-overhaul pass-2 page renders.
 *
 * Source (default): /cursor/stores/bot/bmb-product-previews-pass2/
 * Output: assets/mockups/*.{jpg,webp}
 *
 * Run: node scripts/build-product-mockups.mjs
 * Optional: BMB_PASS2_DIR=/path/to/pngs node scripts/build-product-mockups.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'mockups');
const SRC =
  process.env.BMB_PASS2_DIR ||
  '/cursor/stores/bot/bmb-product-previews-pass2';

const COVER = { w: 760, h: 1074 };
const PAGE = { w: 900, h: 1273 };
const NAVY = { r: 19, g: 34, b: 56 };
const IVORY = { r: 247, g: 244, b: 238 };

/** @type {{ name: string, file: string, kind: 'cover' | 'page' | 'framed', alt: string }[]} */
const ASSETS = [
  // Covers
  { name: 'speech-cover', file: 'p01_speech_cover-1.png', kind: 'cover', alt: 'Best Man Speech Kit cover' },
  { name: 'duties-cover', file: 'p07_duties_cover-1.png', kind: 'cover', alt: 'Best Man Duties Kit cover' },
  { name: 'playbook-cover', file: 'p12_playbook_cover-1.png', kind: 'cover', alt: 'Stag Do and Bachelor Party Playbook cover' },
  { name: 'bundle-cover', file: 'p17_set_cover-1.png', kind: 'cover', alt: 'The Best Man Set cover' },

  // Speech interiors
  { name: 'speech-inside', file: 'p05_speech_example-4.png', kind: 'framed', alt: 'Speech Kit worked example page' },
  { name: 'speech-guide', file: 'p04_speech_guide-2.png', kind: 'framed', alt: 'Speech Kit writing guide page' },
  { name: 'speech-start', file: 'p02_speech_start-1.png', kind: 'framed', alt: 'Speech Kit Start Here page' },
  { name: 'cue-cards', file: 'p06_cue_cards-1.png', kind: 'framed', alt: 'Printable cue cards from the Speech Kit' },

  // Duties interiors
  { name: 'duties-inside', file: 'p08_duties_handbook-2.png', kind: 'framed', alt: 'Duties Kit handbook page' },
  { name: 'duties-planner', file: 'p10_guest_payments-10.png', kind: 'framed', alt: 'Duties Kit guest payments planner page' },
  { name: 'duties-carry', file: 'p11_carry_cards-2.png', kind: 'framed', alt: 'Duties Kit wedding-day carry cards page' },

  // Playbook interiors
  { name: 'playbook-inside', file: 'p15_bingo_a-10.png', kind: 'framed', alt: 'Playbook Stag Bingo card' },
  { name: 'playbook-code', file: 'p13_stag_code-3.png', kind: 'framed', alt: 'Playbook Stag Code page' },
  { name: 'playbook-games', file: 'p14_games_toc-01.png', kind: 'framed', alt: 'Playbook games contents page' },

  // Bundle
  { name: 'bundle-inside', file: 'p18_set_start-1.png', kind: 'framed', alt: 'Best Man Set Start Here page' },
];

fs.mkdirSync(OUT, { recursive: true });

function srcPath(file) {
  const p = path.join(SRC, file);
  if (!fs.existsSync(p)) throw new Error(`Missing source: ${p}`);
  return p;
}

async function pageOnBackdrop(inputPath, { w, h }) {
  const pageW = Math.round(w * 0.78);
  const pageH = Math.round(h * 0.8);
  const page = await sharp(inputPath)
    .resize(pageW, pageH, { fit: 'fill' })
    .png()
    .toBuffer();

  const left = Math.round((w - pageW) / 2);
  const top = Math.round((h - pageH) / 2) - 8;

  // Soft navy studio + ivory page with a simple shadow layer
  const shadow = await sharp({
    create: {
      width: pageW + 24,
      height: pageH + 24,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.28 },
    },
  })
    .blur(18)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: NAVY,
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
            <defs>
              <radialGradient id="g" cx="30%" cy="20%" r="75%">
                <stop offset="0%" stop-color="#203653"/>
                <stop offset="55%" stop-color="#132238"/>
                <stop offset="100%" stop-color="#0B1524"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
            <circle cx="120" cy="160" r="200" fill="#D4A84F" fill-opacity="0.05"/>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
      { input: shadow, left: left - 4, top: top + 10 },
      { input: page, left, top },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function coverBuffer(inputPath, { w, h }) {
  return sharp(inputPath)
    .resize(w, h, { fit: 'fill' })
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();
}

async function writePair(name, jpgBuf) {
  let quality = 84;
  let buf = jpgBuf;
  // Tighten JPEG under ~220KB when possible without wrecking type
  for (let i = 0; i < 5 && buf.length > 220_000 && quality > 62; i++) {
    quality -= 5;
    buf = await sharp(buf).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  const webp = await sharp(buf)
    .webp({ quality: Math.max(70, quality - 2) })
    .toBuffer();

  fs.writeFileSync(path.join(OUT, `${name}.jpg`), buf);
  fs.writeFileSync(path.join(OUT, `${name}.webp`), webp);

  const meta = await sharp(buf).metadata();
  return {
    name,
    width: meta.width,
    height: meta.height,
    jpgKB: Math.round(buf.length / 1024),
    webpKB: Math.round(webp.length / 1024),
    quality,
  };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Pass-2 source directory not found: ${SRC}`);
    process.exit(1);
  }

  const results = [];
  for (const asset of ASSETS) {
    const input = srcPath(asset.file);
    let jpg;
    if (asset.kind === 'cover') {
      jpg = await coverBuffer(input, COVER);
    } else {
      jpg = await pageOnBackdrop(input, PAGE);
    }
    const info = await writePair(asset.name, jpg);
    results.push({ ...info, source: asset.file, alt: asset.alt });
  }

  // Manifest for HTML authors / future swaps
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: SRC,
    assets: results,
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
