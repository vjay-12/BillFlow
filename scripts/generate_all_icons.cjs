const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\vijay\\.gemini\\antigravity-ide\\brain\\9455a0b3-3d48-4fed-9daf-215db756c2cc';
const PROJECT_DIR = 'c:\\Users\\vijay\\Project_26\\Sample\\Billing_app';

const svgPath = path.join(ARTIFACT_DIR, 'logo_clean.svg');
const svgRaw = fs.readFileSync(svgPath, 'utf8');
const match = svgRaw.match(/d="([^"]+)"/);
if (!match) throw new Error('Path d not found');
const pathD = match[1];

// Generate square SVG (for favicon and app icons)
function getSquareLogoSvg({ size = 512, bg = null }) {
  const gradId = 'pasumaiSquareGrad';
  const logoW = Math.round(size * 0.65 * 0.727); // maintain 512:704 aspect ratio
  const logoH = Math.round(size * 0.65);
  const offsetX = Math.round((size - logoW) / 2);
  const offsetY = Math.round((size - logoH) / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0F766E" />
        <stop offset="60%" stop-color="#14A89B" />
        <stop offset="100%" stop-color="#2DD4BF" />
      </linearGradient>
    </defs>
    ${bg ? `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${bg}" />` : ''}
    <g transform="translate(${offsetX}, ${offsetY}) scale(${logoW / 512})">
      <g transform="translate(-64, -64)">
        <path d="${pathD}" fill="url(#${gradId})" fill-rule="evenodd" />
      </g>
    </g>
  </svg>`;
}

// Minimal ICO file generator from a 32x32 / 48x48 PNG buffer
function createIcoFromPng(pngBuffer) {
  // ICO header: 6 bytes
  // ICONDIRENTRY: 16 bytes
  // Image data: pngBuffer
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(48, 0); // Width 48 (or 0 for 256)
  entry.writeUInt8(48, 1); // Height 48
  entry.writeUInt8(0, 2);  // Palette colors
  entry.writeUInt8(0, 3);  // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // Size of image
  entry.writeUInt32LE(6 + 16, 12); // Offset of image data

  return Buffer.concat([header, entry, pngBuffer]);
}

async function run() {
  console.log('Generating all application icons and favicons...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // 1. Write standalone transparent favicon.svg
  const faviconSvg = getSquareLogoSvg({ size: 128, bg: null });
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'favicon.svg'), faviconSvg);
  console.log('Wrote public/favicon.svg');

  // Function to render HTML to PNG buffer
  async function renderToPng(svgStr, width, height) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgStr}</body></html>`);
    return await page.screenshot({ omitBackground: true, type: 'png' });
  }

  // 2. Render favicon.png (64x64 transparent)
  const faviconPng = await renderToPng(getSquareLogoSvg({ size: 64, bg: null }), 64, 64);
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'favicon.png'), faviconPng);
  console.log('Wrote public/favicon.png');

  // 3. Render 48x48 for favicon.ico
  const icoPng = await renderToPng(getSquareLogoSvg({ size: 48, bg: null }), 48, 48);
  const icoBuffer = createIcoFromPng(icoPng);
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'favicon.ico'), icoBuffer);
  console.log('Wrote public/favicon.ico');

  // 4. Render PWA icon-192.png (white/cream opaque background)
  const icon192Svg = getSquareLogoSvg({ size: 192, bg: '#ffffff' });
  const icon192Png = await renderToPng(icon192Svg, 192, 192);
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'icons', 'icon-192.png'), icon192Png);
  console.log('Wrote public/icons/icon-192.png');

  // 5. Render PWA icon-512.png (white/cream opaque background)
  const icon512Svg = getSquareLogoSvg({ size: 512, bg: '#ffffff' });
  const icon512Png = await renderToPng(icon512Svg, 512, 512);
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'icons', 'icon-512.png'), icon512Png);
  console.log('Wrote public/icons/icon-512.png');

  // 6. Render PWA icon-512-maskable.png (with safe margin for circular/squircle mask)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="#ffffff" />
    <defs>
      <linearGradient id="maskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0F766E" />
        <stop offset="60%" stop-color="#14A89B" />
        <stop offset="100%" stop-color="#2DD4BF" />
      </linearGradient>
    </defs>
    <!-- Centered within 70% safe zone for maskable icons -->
    <g transform="translate(160, 96) scale(0.45)">
      <g transform="translate(-64, -64)">
        <path d="${pathD}" fill="url(#maskGrad)" fill-rule="evenodd" />
      </g>
    </g>
  </svg>`;
  const maskablePng = await renderToPng(maskableSvg, 512, 512);
  fs.writeFileSync(path.join(PROJECT_DIR, 'public', 'icons', 'icon-512-maskable.png'), maskablePng);
  console.log('Wrote public/icons/icon-512-maskable.png');

  await browser.close();
  console.log('ALL ICONS EXPORTED SUCCESSFULLY!');
}

run().catch(console.error);
