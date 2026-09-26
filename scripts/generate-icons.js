import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  // Background teal: #0F766E (R: 15, G: 118, B: 110, A: 255)
  const bgR = 15, bgG = 118, bgB = 110;
  // White icon: #FFFFFF
  const fgR = 255, fgG = 255, fgB = 255;

  const centerX = width / 2;
  const centerY = height / 2;
  const iconRadius = isMaskable ? width * 0.28 : width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw bill icon / rupee graphic in the center
      const dx = x - centerX;
      const dy = y - centerY;

      // Card / Bill rectangle
      const rectW = iconRadius * 1.0;
      const rectH = iconRadius * 1.3;
      const inRect = Math.abs(dx) <= rectW && Math.abs(dy) <= rectH;
      const isBorder = inRect && (
        Math.abs(Math.abs(dx) - rectW) < width * 0.02 ||
        Math.abs(Math.abs(dy) - rectH) < height * 0.02
      );

      // Horizontal lines on bill
      const isLine1 = Math.abs(dy - (-rectH * 0.4)) < height * 0.015 && Math.abs(dx) < rectW * 0.7;
      const isLine2 = Math.abs(dy - (-rectH * 0.05)) < height * 0.015 && Math.abs(dx) < rectW * 0.7;
      const isLine3 = Math.abs(dy - (rectH * 0.3)) < height * 0.015 && Math.abs(dx) < rectW * 0.4;

      // Center dot/badge
      const inCenterCircle = (dx * dx + (dy - rectH * 0.3) * (dy - rectH * 0.3)) < (width * 0.06) * (width * 0.06);

      const isIconPixel = isBorder || isLine1 || isLine2 || isLine3 || inCenterCircle;

      if (isIconPixel) {
        rawData[pxOffset] = fgR;
        rawData[pxOffset + 1] = fgG;
        rawData[pxOffset + 2] = fgB;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(outDir, 'icon-512-maskable.png'), generatePNG(512, 512, true));

console.log('Icons generated successfully in public/icons/');
