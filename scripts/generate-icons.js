import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = 'C:\\Users\\vijay\\AppData\\Local\\Temp\\chrome_icon_gen';

const LEAF_PATH = 'M 16 94 C 16 94, 25 80, 20 62 C 14 44, 14 24, 38 10 C 58 -2, 86 2, 94 20 C 98 28, 96 54, 80 74 C 64 90, 38 92, 16 94 Z M 36 28 L 36 74 L 47 74 L 47 54 L 58 54 C 68 54, 76 48, 76 41 C 76 34, 68 28, 58 28 L 36 28 Z M 47 36 L 56 36 C 62 36, 65 38, 65 41 C 65 44, 62 46, 56 46 L 47 46 L 47 36 Z';

// PWA icons need a solid light background for arbitrary wallpaper/launcher contrast
const pwaIconHtml = (size, markRatio = 0.68) => {
  const markSize = Math.round(size * markRatio);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size}px;
    height: ${size}px;
    background: #ffffff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: ${markSize}px;
    height: ${markSize}px;
    color: #0F766E;
  }
</style>
</head>
<body>
  <svg viewBox="0 0 100 100" fill="currentColor">
    <path fill-rule="evenodd" clip-rule="evenodd" d="${LEAF_PATH}" />
  </svg>
</body>
</html>`;
};

// Favicon icon sits directly on transparent background
const faviconHtml = (size) => {
  const markSize = Math.round(size * 0.90);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: ${markSize}px;
    height: ${markSize}px;
    color: #0F766E;
  }
</style>
</head>
<body>
  <svg viewBox="0 0 100 100" fill="currentColor">
    <path fill-rule="evenodd" clip-rule="evenodd" d="${LEAF_PATH}" />
  </svg>
</body>
</html>`;
};

async function main() {
  console.log('Generating custom Leaf + P monogram icons via Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  let wsUrl = '';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  const pagesRes = await fetch('http://127.0.0.1:9223/json/list');
  const pages = await pagesRes.json();
  const page = pages.find((p) => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let idCounter = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');

  // Ensure public/icons directory exists
  if (!fs.existsSync(path.resolve('public/icons'))) {
    fs.mkdirSync(path.resolve('public/icons'), { recursive: true });
  }

  // Generate PWA manifest icons
  const pwaIcons = [
    { name: 'icon-192.png', size: 192, html: pwaIconHtml(192, 0.68) },
    { name: 'icon-512.png', size: 512, html: pwaIconHtml(512, 0.68) },
    { name: 'icon-512-maskable.png', size: 512, html: pwaIconHtml(512, 0.60) }, // 60% safe zone for launcher mask
  ];

  for (const icon of pwaIcons) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: icon.size,
      height: icon.size,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(icon.html)}`;
    await send('Page.navigate', { url: dataUrl });
    await new Promise((r) => setTimeout(r, 400));

    const { data } = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: icon.size, height: icon.size, scale: 1 },
      omitBackground: false,
    });

    const outPath = path.resolve('public/icons', icon.name);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size}) -> ${outPath}`);
  }

  // Generate transparent 48x48 PNG for favicon.ico and favicon.png
  await send('Emulation.setDeviceMetricsOverride', {
    width: 48,
    height: 48,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const favHtml = faviconHtml(48);
  await send('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(favHtml)}` });
  await new Promise((r) => setTimeout(r, 400));

  const { data: favData } = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 48, height: 48, scale: 1 },
    omitBackground: true, // transparent background for browser tab favicon
  });

  const favPngBuffer = Buffer.from(favData, 'base64');
  fs.writeFileSync(path.resolve('public/favicon.png'), favPngBuffer);
  console.log('Generated public/favicon.png (48x48 transparent)');

  // Pack 48x48 PNG as ICO
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // icon type (1 = icon)
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(48, 0); // width (48px)
  icoDirEntry.writeUInt8(48, 1); // height (48px)
  icoDirEntry.writeUInt8(0, 2);  // color palette
  icoDirEntry.writeUInt8(0, 3);  // reserved
  icoDirEntry.writeUInt16LE(1, 4); // color planes
  icoDirEntry.writeUInt16LE(32, 6); // bpp (32-bit RGBA)
  icoDirEntry.writeUInt32LE(favPngBuffer.length, 8); // image data length
  icoDirEntry.writeUInt32LE(22, 12); // offset (header 6 + 1 dir entry 16 = 22)

  const icoBuffer = Buffer.concat([icoHeader, icoDirEntry, favPngBuffer]);
  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
  console.log('Generated public/favicon.ico');

  chrome.kill();
  console.log('All monogram icons generated successfully!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
