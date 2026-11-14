import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * File and pixel checks for the 14 Nov photo-led social templates.
 *
 * BMB_SOCIAL_FIXTURES — directory of the 17 PNGs. Defaults to tests/fixtures/social.
 * The suite skips, with a reason, when that directory is missing or has no PNGs.
 *
 * BMB_COMPOSE_SOURCES — optional path.delimiter-separated compose scripts
 * (compose.py:compose_carousel.py). Skips when unset.
 */

const FIXTURES = path.resolve(
  process.env.BMB_SOCIAL_FIXTURES || path.join(process.cwd(), 'tests/fixtures/social'),
);

const ASSETS: { file: string; w: number; h: number; corner: number }[] = [
  { file: 'PIN_01_speech_they_quote.png', w: 1000, h: 1500, corner: 70 },
  { file: 'PIN_02_brother_20_years.png', w: 1000, h: 1500, corner: 70 },
  { file: 'PIN_03_phone_notes.png', w: 1000, h: 1500, corner: 70 },
  { file: 'PIN_04_night_before.png', w: 1000, h: 1500, corner: 70 },
  { file: 'PIN_05_stag_legend.png', w: 1000, h: 1500, corner: 70 },
  { file: 'IG_01_never_open.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_02_room_goes_quiet.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_03_cards_not_phone.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_04_who_pays.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_carousel_cover_5_parts.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_02_introduce.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_03_true_story.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_04_what_it_means.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_05_celebrate.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_06_toast.png', w: 1080, h: 1350, corner: 60 },
  { file: 'IG_05_slide_07_kit_cta.png', w: 1080, h: 1350, corner: 60 },
  { file: 'STORY_01_before_you_walk_in.png', w: 1080, h: 1920, corner: 60 },
];

const GOLD = { r: 201, g: 162, b: 77 };

function fixturesSkipReason(): string | null {
  if (!process.env.BMB_SOCIAL_FIXTURES && !fs.existsSync(FIXTURES)) {
    return `Social fixtures directory is missing (${FIXTURES}). Set BMB_SOCIAL_FIXTURES to the folder of PNG assets. Render checks skipped.`;
  }
  if (!fs.existsSync(FIXTURES) || !fs.statSync(FIXTURES).isDirectory()) {
    return `Social fixtures path is not a directory (${FIXTURES}). Set BMB_SOCIAL_FIXTURES to the folder of PNG assets. Render checks skipped.`;
  }
  const pngs = fs.readdirSync(FIXTURES).filter((name) => name.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    return `No PNG fixtures in ${FIXTURES}. Set BMB_SOCIAL_FIXTURES to the folder that contains the 17 photo-led assets. Render checks skipped.`;
  }
  return null;
}

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const dl = Math.abs(estimate - left);
  const du = Math.abs(estimate - up);
  const dul = Math.abs(estimate - upLeft);
  if (dl <= du && dl <= dul) return left;
  if (du <= dul) return up;
  return upLeft;
}

type Raster = { w: number; h: number; rgba: Uint8Array };

/** Decode an 8-bit non-interlaced PNG (RGB, RGBA, grey, or palette) to straight RGBA. */
function decodePng(buf: Buffer): Raster {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buf.subarray(0, 8).equals(signature)) throw new Error('not a PNG');

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat: Buffer[] = [];
  let palette: Buffer | null = null;
  let transparency: Buffer | null = null;

  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') {
      palette = Buffer.from(data);
    } else if (type === 'tRNS') {
      transparency = Buffer.from(data);
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (interlace !== 0) throw new Error('interlaced PNG is not supported');
  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} is not supported`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`colour type ${colorType} is not supported`);

  const rowBytes = width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const raw = Buffer.alloc(height * rowBytes);
  let input = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[input++];
    const row = y * rowBytes;
    for (let x = 0; x < rowBytes; x++) {
      const left = x >= channels ? raw[row + x - channels] : 0;
      const up = y > 0 ? raw[row - rowBytes + x] : 0;
      const upLeft = y > 0 && x >= channels ? raw[row - rowBytes + x - channels] : 0;
      const sample = inflated[input++];
      let value = sample;
      if (filter === 1) value = (sample + left) & 255;
      else if (filter === 2) value = (sample + up) & 255;
      else if (filter === 3) value = (sample + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) value = (sample + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`);
      raw[row + x] = value;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const src = i * channels;
    const dst = i * 4;
    if (colorType === 2) {
      rgba.set(raw.subarray(src, src + 3), dst);
      rgba[dst + 3] = 255;
    } else if (colorType === 6) {
      rgba.set(raw.subarray(src, src + 4), dst);
    } else if (colorType === 0) {
      rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = raw[src];
      rgba[dst + 3] = 255;
    } else if (colorType === 4) {
      rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = raw[src];
      rgba[dst + 3] = raw[src + 1];
    } else if (colorType === 3 && palette) {
      const index = raw[src];
      rgba[dst] = palette[index * 3];
      rgba[dst + 1] = palette[index * 3 + 1];
      rgba[dst + 2] = palette[index * 3 + 2];
      rgba[dst + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    }
  }
  return { w: width, h: height, rgba };
}

function isGold(r: number, g: number, b: number, a: number): boolean {
  if (a < 128) return false;
  const tolerance = 35;
  return Math.abs(r - GOLD.r) <= tolerance && Math.abs(g - GOLD.g) <= tolerance && Math.abs(b - GOLD.b) <= tolerance;
}

function bottomCornersClear(image: Raster, corner: number): boolean {
  const regions = [
    { x0: 0, y0: image.h - corner },
    { x0: image.w - corner, y0: image.h - corner },
  ];
  for (const region of regions) {
    for (let y = region.y0; y < region.y0 + corner; y++) {
      for (let x = region.x0; x < region.x0 + corner; x++) {
        const i = (y * image.w + x) * 4;
        if (isGold(image.rgba[i], image.rgba[i + 1], image.rgba[i + 2], image.rgba[i + 3])) return false;
      }
    }
  }
  return true;
}

test.describe('photo-led social render checks', () => {
  test.beforeEach(() => {
    const reason = fixturesSkipReason();
    test.skip(reason !== null, reason || undefined);
  });

  for (const asset of ASSETS) {
    test(`${asset.file} is ${asset.w}×${asset.h} and keeps gold out of the bottom ${asset.corner}px corners`, () => {
      const file = path.join(FIXTURES, asset.file);
      test.skip(!fs.existsSync(file), `missing ${asset.file} in ${FIXTURES}`);
      const image = decodePng(fs.readFileSync(file));
      expect(image.w, asset.file).toBe(asset.w);
      expect(image.h, asset.file).toBe(asset.h);
      expect(
        bottomCornersClear(image, asset.corner),
        `${asset.file} has brand gold inside a bottom ${asset.corner}px corner`,
      ).toBe(true);
    });
  }
});

test('compose sources do not include prices, Klarna, or AI-disclosure lines', () => {
  const sources = (process.env.BMB_COMPOSE_SOURCES || '')
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
  test.skip(
    sources.length === 0,
    'BMB_COMPOSE_SOURCES is unset. Pass compose.py and compose_carousel.py separated by a colon to check them. Render source check skipped.',
  );
  const forbid = [/Klarna/i, /£\d/, /\$\d/, /AI[- ]generated/i, /made with AI/i, /ChatGPT/i, /disclosure/i];
  for (const src of sources) {
    const text = fs.readFileSync(src, 'utf8');
    for (const pattern of forbid) {
      expect(text, `${src} matched ${pattern}`).not.toMatch(pattern);
    }
  }
});
