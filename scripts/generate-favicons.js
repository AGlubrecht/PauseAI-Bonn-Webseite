const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '..', 'src', 'assets', 'images', 'bonn_logo.svg');
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'images');

// Logo geometry in 800x800 space
const ANGLE = -11.309932 * Math.PI / 180;
const COS_A = Math.cos(-ANGLE); // un-rotate uses positive angle
const SIN_A = Math.sin(-ANGLE);

const BLACK = [0, 0, 0, 255];
const WHITE = [255, 255, 255, 255];
const ORANGE = [255, 148, 22, 255];

function getPixelColor(sx, sy) {
  // Layer 1: white bars (topmost)
  if (sy >= 195 && sy < 605) {
    if ((sx >= 270 && sx < 360) || (sx >= 440 && sx < 530)) {
      return WHITE;
    }
  }

  // Layer 2: black plaque
  if (sx >= 200 && sx < 600 && sy >= 144 && sy < 656) {
    return BLACK;
  }

  // Layer 3: orange band (un-rotate point around center 400,400)
  const dx = sx - 400;
  const dy = sy - 400;
  const uy = SIN_A * dx + COS_A * dy + 400;
  if (uy >= 326 && uy < 474) {
    return ORANGE;
  }

  // Layer 4: black background
  return BLACK;
}

function renderPixels(size) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = 800 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sample at pixel center, mapped to 800x800 space
      const sx = (x + 0.5) * scale;
      const sy = (y + 0.5) * scale;
      const color = getPixelColor(sx, sy);
      const offset = (y * size + x) * 4;
      buf[offset] = color[0];
      buf[offset + 1] = color[1];
      buf[offset + 2] = color[2];
      buf[offset + 3] = color[3];
    }
  }

  return buf;
}

async function generateHandPainted(size, filename) {
  const raw = renderPixels(size);
  const buffer = await sharp(raw, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toBuffer();

  if (filename) {
    fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
    console.log(`  ${filename} (${size}x${size})`);
  }

  return buffer;
}

function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const headerSize = 6 + numImages * 16;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  let dataOffset = headerSize;

  for (const { buffer, size } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size < 256 ? size : 0, 0);
    entry.writeUInt8(size < 256 ? size : 0, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dirEntries.push(entry);
    dataOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function main() {
  console.log('Generating hand-painted favicon PNGs (no anti-aliasing)...');
  await generateHandPainted(16, 'favicon-16x16.png');
  await generateHandPainted(32, 'favicon-32x32.png');

  // 180x180 is large enough — use sharp SVG rasterizer
  await sharp(SVG_PATH).resize(180, 180).png()
    .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'));
  console.log('  apple-touch-icon.png (180x180)');

  console.log('Generating favicon.ico (16+32+48)...');
  const icoBuffers = [];
  for (const size of [16, 32, 48]) {
    const buffer = await generateHandPainted(size, null);
    icoBuffers.push({ buffer, size });
  }
  const ico = createIco(icoBuffers);
  fs.writeFileSync(path.join(OUT_DIR, 'favicon.ico'), ico);
  console.log('  favicon.ico');

  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
