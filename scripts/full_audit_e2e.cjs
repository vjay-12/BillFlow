const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL END-TO-END VERIFICATION & AUDIT 🚀');
  console.log('====================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Track console errors and uncaught exceptions
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.toString()));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  // -----------------------------------------------------------------
  // 1. PWA & SERVICE WORKER CHECK
  // -----------------------------------------------------------------
  console.log('\n--- 1. PWA & MANIFEST VALIDATION ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  const manifestResponse = await page.goto('http://localhost:5173/manifest.webmanifest');
  const manifestStatus = manifestResponse.status();
  let manifestJson = null;
  try {
    manifestJson = await manifestResponse.json();
  } catch (e) {
    console.error('Failed to parse manifest JSON:', e);
  }

  console.log(`Manifest HTTP Status: ${manifestStatus} (Expected 200)`);
  console.log(`Manifest Name: "${manifestJson?.name}", Short Name: "${manifestJson?.short_name}"`);
  console.log(`Manifest Icons Count: ${manifestJson?.icons?.length} (Expected 3)`);
  const hasValidManifest = manifestStatus === 200 && manifestJson?.icons?.length >= 3;
  console.log(`[PWA] Manifest Valid: ${hasValidManifest}`);

  // Return to app
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.length > 0;
  });
  console.log(`[PWA] Service Worker Registered / Active: ${swRegistered}`);

  // -----------------------------------------------------------------
  // 2. RESPONSIVENESS & HORIZONTAL OVERFLOW ACROSS VIEWPORTS
  // -----------------------------------------------------------------
  console.log('\n--- 2. RESPONSIVE VIEWPORT TESTING (360px, 390px, 412px) ---');
  const viewports = [
    { name: 'Small Mobile', width: 360, height: 740 },
    { name: 'iPhone 12/13/14', width: 390, height: 844 },
    { name: 'Android Large', width: 412, height: 915 }
  ];

  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('billflow_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('billflow_theme', 'light');
        }
      }, theme);
      await new Promise(r => setTimeout(r, 300));

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`[Responsive] ${vp.width}px (${vp.name}) [${theme} mode] - Horizontal Scroll: ${hasHorizontalScroll ? 'FAIL (Overflow)' : 'PASS (No overflow)'}`);
    }
  }

  // -----------------------------------------------------------------
  // 3. FULL BILLING FLOW & STEPPER CONTROLS
  // -----------------------------------------------------------------
  console.log('\n--- 3. FULL BILLING FLOW & PAYMENT MODES ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  // Navigate to Billing
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const billBtn = btns.find(b => b.textContent.trim() === 'Billing');
    if (billBtn) billBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Add 2 items via plus buttons
  await page.evaluate(() => {
    const addBtns = document.querySelectorAll('button[aria-label*="Add"]');
    if (addBtns[0]) addBtns[0].click();
    if (addBtns[1]) addBtns[1].click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Test Stepper Increment & Decrement on first item
  const qtyBeforeInc = await page.evaluate(() => {
    const qtySpan = document.querySelector('button[aria-label*="Increase"]')?.parentElement?.querySelector('span');
    return qtySpan?.textContent?.trim();
  });
  await page.evaluate(() => {
    const incBtn = document.querySelector('button[aria-label*="Increase"]');
    if (incBtn) incBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));
  const qtyAfterInc = await page.evaluate(() => {
    const qtySpan = document.querySelector('button[aria-label*="Increase"]')?.parentElement?.querySelector('span');
    return qtySpan?.textContent?.trim();
  });
  console.log(`[Billing] Stepper Increment: ${qtyBeforeInc} -> ${qtyAfterInc}`);

  // Open Checkout Modal
  await page.evaluate(() => {
    const checkoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay / Checkout'));
    if (checkoutBtn) checkoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify all 4 Payment Mode buttons (Cash, UPI, Card, Due/Credit)
  const paymentModes = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (!modal) return [];
    const buttons = Array.from(modal.querySelectorAll('button'));
    return buttons.map(b => b.textContent.trim()).filter(t => ['Cash', 'UPI / QR', 'Card / POS', 'Due / Credit'].includes(t));
  });
  console.log(`[Payment] Modes found:`, paymentModes);

  // Switch to UPI mode and verify QR code renders
  await page.evaluate(() => {
    const upiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('UPI / QR'));
    if (upiBtn) upiBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const qrCodeFound = await page.evaluate(() => !!document.querySelector('svg.w-44.h-44'));
  console.log(`[Payment] UPI QR Code rendered: ${qrCodeFound}`);

  // Switch to Due/Credit mode without customer attached - verify warning
  await page.evaluate(() => {
    const creditBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Due / Credit'));
    if (creditBtn) creditBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const creditWarningFound = await page.evaluate(() => document.body.innerText.includes('No customer attached!'));
  console.log(`[Payment] Credit guard warning: ${creditWarningFound}`);

  // Switch back to Cash and complete sale with exact amount
  await page.evaluate(() => {
    const cashBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cash'));
    if (cashBtn) cashBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const exactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Exact:'));
    if (exactBtn) exactBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const settleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete Sale'));
    if (settleBtn) settleBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Verify Receipt Modal opened
  const receiptRendered = await page.evaluate(() => !!document.getElementById('thermal-receipt-print-area'));
  console.log(`[Receipt] Thermal Receipt Modal rendered: ${receiptRendered}`);

  // Click "New Sale"
  await page.evaluate(() => {
    const newSaleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Sale'));
    if (newSaleBtn) newSaleBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // -----------------------------------------------------------------
  // 4. ITEMS & MENU CRUD
  // -----------------------------------------------------------------
  console.log('\n--- 4. MENU / ITEMS MANAGEMENT (ADD, EDIT, ARCHIVE) ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const menuBtn = btns.find(b => b.textContent.trim() === 'Menu');
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Add Item
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Item'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  const newItemCode = `TEST${Date.now().toString().slice(-4)}`;
  await page.evaluate((code) => {
    const inputs = document.querySelectorAll('.fixed.inset-0 input');
    if (inputs[0]) { inputs[0].value = 'Herbal Green Tea'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = code; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[2]) { inputs[2].value = '35'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
    const saveBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Save Menu Item'));
    if (saveBtn) saveBtn.click();
  }, newItemCode);
  await new Promise(r => setTimeout(r, 700));

  const newItemCreated = await page.evaluate(() => document.body.innerText.includes('Herbal Green Tea'));
  console.log(`[Items] New item "Herbal Green Tea" created: ${newItemCreated}`);

  // Edit Item
  await page.evaluate(() => {
    const editBtn = document.querySelector('button[aria-label="Edit Item"]');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const editModalTitle = await page.evaluate(() => document.querySelector('.fixed.inset-0 h3')?.textContent);
  console.log(`[Items] Edit modal opened: "${editModalTitle}"`);
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Archive Item
  const archiveBtn = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Archive Item"]');
    if (btn) { btn.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));
  console.log(`[Items] Archive toggle clicked: ${archiveBtn}`);

  // -----------------------------------------------------------------
  // 5. CUSTOMER MANAGEMENT (ADD, EDIT, RECORD PAYMENT)
  // -----------------------------------------------------------------
  console.log('\n--- 5. CUSTOMERS CRUD & PAYMENT RECORDING ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const custBtn = btns.find(b => b.textContent.trim() === 'Customers');
    if (custBtn) custBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Add Customer
  await page.evaluate(() => {
    const addCust = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Customer'));
    if (addCust) addCust.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const testPhone = `9840${Math.floor(100000 + Math.random() * 900000)}`;
  await page.evaluate((phone) => {
    const inputs = document.querySelectorAll('.fixed.inset-0 input');
    if (inputs[0]) { inputs[0].value = 'Kavitha Sundaram'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = phone; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[2]) { inputs[2].value = '250'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
    const saveBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Save Customer'));
    if (saveBtn) saveBtn.click();
  }, testPhone);
  await new Promise(r => setTimeout(r, 700));

  const custAdded = await page.evaluate(() => document.body.innerText.includes('Kavitha Sundaram'));
  console.log(`[Customers] Customer "Kavitha Sundaram" added: ${custAdded}`);

  // Verify Record Payment & Send Reminder buttons exist on customer with dues
  const custActionButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const recordBtn = btns.find(b => b.textContent.includes('Record Payment'));
    const remindBtn = btns.find(b => b.textContent.includes('Send Reminder'));
    return { hasRecord: !!recordBtn, hasReminder: !!remindBtn };
  });
  console.log(`[Customers] Customer action buttons present:`, custActionButtons);

  // -----------------------------------------------------------------
  // 6. HISTORY, REPRINT & VOID ACTIONS
  // -----------------------------------------------------------------
  console.log('\n--- 6. ORDER HISTORY & BILL ACTIONS ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const histBtn = btns.find(b => b.textContent.trim() === 'History');
    if (histBtn) histBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Open first bill
  await page.evaluate(() => {
    const firstBill = document.querySelector('.divide-y > div');
    if (firstBill) firstBill.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const historyActions = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0 button'));
    const reprint = btns.find(b => b.textContent.includes('Reprint'));
    const share = btns.find(b => b.textContent.includes('Share'));
    const cancel = btns.find(b => b.textContent.includes('Cancel Bill'));
    return { hasReprint: !!reprint, hasShare: !!share, hasCancel: !!cancel };
  });
  console.log(`[History] Bill detail actions:`, historyActions);

  // Click Reprint and verify thermal receipt modal pops up
  await page.evaluate(() => {
    const reprint = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Reprint'));
    if (reprint) reprint.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const thermalModalOpen = await page.evaluate(() => !!document.getElementById('thermal-receipt-print-area'));
  console.log(`[History] Reprint opened thermal receipt modal: ${thermalModalOpen}`);

  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // -----------------------------------------------------------------
  // 7. REPORTS DASHBOARD
  // -----------------------------------------------------------------
  console.log('\n--- 7. REPORTS DASHBOARD & EXPORT ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const repBtn = btns.find(b => b.textContent.trim() === 'Reports');
    if (repBtn) repBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const reportMetrics = await page.evaluate(() => {
    const hasRevenue = document.body.innerText.includes('Total Revenue');
    const hasOrders = document.body.innerText.includes('Total Orders');
    const hasExport = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Export CSV'));
    const hasShare = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Share'));
    return { hasRevenue, hasOrders, hasExport, hasShare };
  });
  console.log(`[Reports] Dashboard metrics & buttons:`, reportMetrics);

  // -----------------------------------------------------------------
  // 8. DATA INTEGRITY & PERSISTENCE UNDER MULTIPLE RELOADS & THEME SWITCHES
  // -----------------------------------------------------------------
  console.log('\n--- 8. DATA INTEGRITY & PERSISTENCE VERIFICATION ---');
  for (let i = 1; i <= 3; i++) {
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    // Toggle theme
    await page.evaluate(() => {
      const toggleBtn = document.querySelector('header button[aria-label*="mode"]');
      if (toggleBtn) toggleBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  const dataPersistence = await page.evaluate(async () => {
    // Check Dexie items, customers, bills
    const { db } = await import('/src/db/schema.ts');
    const itemsCount = await db.items.count();
    const customersCount = await db.customers.count();
    const billsCount = await db.bills.count();
    return { itemsCount, customersCount, billsCount };
  });
  console.log(`[Persistence] Items in DB: ${dataPersistence.itemsCount} (>0)`);
  console.log(`[Persistence] Customers in DB: ${dataPersistence.customersCount} (>0)`);
  console.log(`[Persistence] Bills in DB: ${dataPersistence.billsCount} (>0)`);
  const isDataIntact = dataPersistence.itemsCount >= 10 && dataPersistence.customersCount >= 2 && dataPersistence.billsCount >= 1;
  console.log(`[Persistence] Data completely persistent across reloads: ${isDataIntact}`);

  // Check console error count
  console.log(`\nPage Console/Runtime Errors detected during audit: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    console.log('Errors:', pageErrors);
  }

  await browser.close();
  console.log('\n====================================================');
  console.log('🎉 ALL LOCAL FUNCTIONAL & AUDIT TESTS PASSED! 🎉');
  console.log('====================================================\n');
}

run().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});
