import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = 'C:\\Users\\vijay\\AppData\\Local\\Temp\\chrome_icon_gen';

const svgLightStandard = (size, rx) => `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${size}px; height: ${size}px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .icon-box {
    width: ${size}px;
    height: ${size}px;
    background-color: #0F766E;
    border-radius: ${rx}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .letter {
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-weight: 900;
    font-size: ${Math.round(size * 0.66)}px;
    line-height: 1;
    transform: translateY(2%);
    user-select: none;
  }
</style>
</head>
<body>
  <div class="icon-box">
    <span class="letter">P</span>
  </div>
</body>
</html>`;

const svgLightMaskable = (size) => `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${size}px; height: ${size}px; background: #0F766E; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .icon-box {
    width: ${size}px;
    height: ${size}px;
    background-color: #0F766E;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .letter {
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-weight: 900;
    font-size: ${Math.round(size * 0.52)}px;
    line-height: 1;
    transform: translateY(2%);
    user-select: none;
  }
</style>
</head>
<body>
  <div class="icon-box">
    <span class="letter">P</span>
  </div>
</body>
</html>`;

async function main() {
  console.log('Generating PWA icons via Chrome...');
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

  const icons = [
    { name: 'icon-192.png', size: 192, html: svgLightStandard(192, 40) },
    { name: 'icon-512.png', size: 512, html: svgLightStandard(512, 110) },
    { name: 'icon-512-maskable.png', size: 512, html: svgLightMaskable(512) },
  ];

  for (const icon of icons) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: icon.size,
      height: icon.size,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(icon.html)}`;
    await send('Page.navigate', { url: dataUrl });
    await new Promise((r) => setTimeout(r, 500));

    const { data } = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: icon.size, height: icon.size, scale: 1 },
      omitBackground: false,
    });

    const outPath = path.resolve('public/icons', icon.name);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size}) -> ${outPath}`);
  }

  // Generate 48x48 for favicon.ico
  await send('Emulation.setDeviceMetricsOverride', {
    width: 48,
    height: 48,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const faviconHtml = svgLightStandard(48, 10);
  await send('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(faviconHtml)}` });
  await new Promise((r) => setTimeout(r, 400));

  const { data: favData } = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 48, height: 48, scale: 1 },
    omitBackground: false,
  });

  const favPngBuffer = Buffer.from(favData, 'base64');
  
  // Pack as ICO
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // icon type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(48, 0); // width
  icoDirEntry.writeUInt8(48, 1); // height
  icoDirEntry.writeUInt8(0, 2);  // color palette
  icoDirEntry.writeUInt8(0, 3);  // reserved
  icoDirEntry.writeUInt16LE(1, 4); // color planes
  icoDirEntry.writeUInt16LE(32, 6); // bpp
  icoDirEntry.writeUInt32LE(favPngBuffer.length, 8); // image size
  icoDirEntry.writeUInt32LE(22, 12); // image offset (6 + 16 = 22)

  const icoBuffer = Buffer.concat([icoHeader, icoDirEntry, favPngBuffer]);
  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
  console.log('Generated public/favicon.ico');

  chrome.kill();
  console.log('All icons generated successfully!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
