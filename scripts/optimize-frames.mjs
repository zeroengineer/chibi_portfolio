#!/usr/bin/env node
// Turns the raw 1280×720 PNG walk/aging frames into small, tightly-cropped WebPs.
//
// Every frame is cropped to the *union* bounding box of all frames so the
// character never jitters between frames, then resized and encoded.
//
//   node scripts/optimize-frames.mjs          regenerate public/frames + manifest
//   node scripts/optimize-frames.mjs --check  verify generated output is present & in sync
import { readdir, mkdir, rm, writeFile, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'raw-assets/frames');
const OUT_DIR = path.join(ROOT, 'public/frames');
const MANIFEST = path.join(ROOT, 'src/data/frames.json');

const OUTPUT_HEIGHT = 640;
const ALPHA_THRESHOLD = 8;
const PADDING = 6;

const sources = (await readdir(SRC_DIR)).filter((f) => /^f\d{3}\.png$/.test(f)).sort();
if (sources.length === 0) throw new Error(`No frames found in ${SRC_DIR}`);

if (process.argv.includes('--check')) {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const outputs = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.webp'));
  if (manifest.count !== sources.length || outputs.length !== sources.length) {
    console.error(
      `Frames out of sync: ${sources.length} sources, ${outputs.length} outputs, manifest says ${manifest.count}. Run \`npm run frames\`.`,
    );
    process.exit(1);
  }
  console.log(`✓ ${outputs.length} frames in sync`);
  process.exit(0);
}

async function opaqueBounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width,
    minY = info.height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, width: info.width, height: info.height };
}

const bounds = await Promise.all(sources.map((f) => opaqueBounds(path.join(SRC_DIR, f))));
const { width: srcW, height: srcH } = bounds[0];
const left = Math.max(0, Math.min(...bounds.map((b) => b.minX)) - PADDING);
const top = Math.max(0, Math.min(...bounds.map((b) => b.minY)) - PADDING);
const right = Math.min(srcW - 1, Math.max(...bounds.map((b) => b.maxX)) + PADDING);
const bottom = Math.min(srcH - 1, Math.max(...bounds.map((b) => b.maxY)) + PADDING);
const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };

const outHeight = Math.min(OUTPUT_HEIGHT, crop.height);
const outWidth = Math.round((crop.width / crop.height) * outHeight);

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

let totalBytes = 0;
for (const file of sources) {
  const out = path.join(OUT_DIR, file.replace(/\.png$/, '.webp'));
  await sharp(path.join(SRC_DIR, file))
    .extract(crop)
    .resize(outWidth, outHeight)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(out);
  totalBytes += (await stat(out)).size;
}

const manifest = { count: sources.length, width: outWidth, height: outHeight, ext: 'webp' };
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`crop ${crop.width}×${crop.height} @ (${crop.left},${crop.top}) → ${outWidth}×${outHeight}`);
console.log(`${sources.length} frames, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total`);
