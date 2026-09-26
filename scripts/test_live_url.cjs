const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\vijay\\.gemini\\antigravity-ide\\brain\\9455a0b3-3d48-4fed-9daf-215db756c2cc';
const LIVE_URL = 'https://bill-flow-rouge.vercel.app/';

async function testLive() {
  console.log(`Testing Live URL: ${LIVE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.toString()));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // 1. Test Desktop Chrome
  await page.setViewport({ width: 1280, height: 800 });
  const resp = await page.goto(LIVE_URL, { waitUntil: 'networkidle0' });
  const status = resp.status();
  console.log(`[Live Desktop] HTTP Status: ${status}`);

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_desktop.png') });

  const desktopTitle = await page.title();
  console.log(`[Live Desktop] Title: "${desktopTitle}"`);

  // 2. Test Mobile Chrome (390px)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const mobileInfo = await page.evaluate(() => {
    const headerTitle = document.querySelector('h1')?.textContent?.trim();
    const logoSvg = document.querySelector('header svg[aria-label="Pasumai Cafe Logo"]');
    const itemsCount = document.querySelectorAll('.grid > div').length;
    return { headerTitle, hasLogo: !!logoSvg, itemsCount };
  });
  console.log(`[Live Mobile] Info:`, mobileInfo);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_mobile.png') });

  // 3. Test Theme Toggle on Live Site
  await page.evaluate(() => {
    const toggle = document.querySelector('header button[aria-label*="mode"]');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const isDarkLive = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`[Live Mobile] Dark mode toggled: ${isDarkLive}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_mobile_dark.png') });

  console.log(`[Live] Page errors detected: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Live errors:', errors);
  }

  await browser.close();
  console.log('Live verification complete!');
}

testLive().catch(console.error);
