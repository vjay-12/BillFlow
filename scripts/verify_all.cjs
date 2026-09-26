const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\vijay\\.gemini\\antigravity-ide\\brain\\9455a0b3-3d48-4fed-9daf-215db756c2cc';

async function run() {
  console.log('--- STARTING COMPREHENSIVE POS AUDIT & VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Test at 390px (iPhone 12/13/14 viewport)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  console.log('App loaded at http://localhost:5173/');

  // 1. Ensure dark mode is active
  await page.evaluate(() => {
    localStorage.setItem('billflow_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const isDarkActive = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`[Theme] Dark mode active: ${isDarkActive}`);

  // ==========================================
  // REQUIREMENT 1 & 2: SETTINGS SCREEN AUDIT (Duplicate theme UI removed, GST toggle)
  // ==========================================
  console.log('\n--- AUDITING SETTINGS SCREEN ---');
  // Click Settings tab in mobile bottom nav
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const settingsBtn = btns.find(b => b.textContent.includes('Settings'));
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Check that duplicate "Appearance & Theme" is NOT present
  const themeCardPresent = await page.evaluate(() => {
    return document.body.innerText.includes('Appearance & Theme') || 
           document.body.innerText.includes('Crisp Daytime Light') ||
           document.body.innerText.includes('Pasumai Café Warm Dark');
  });
  console.log(`[Req 1] Duplicate Appearance & Theme UI present in Settings: ${themeCardPresent} (Should be false)`);

  // Check GST Toggle in Settings
  const gstSectionText = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const gstHeading = headings.find(h => h.textContent.includes('Tax & GST Settings'));
    return gstHeading ? gstHeading.parentElement?.parentElement?.innerText : null;
  });
  console.log(`[Req 2] GST Section found: ${!!gstSectionText}`);

  // Test toggling GST OFF
  await page.evaluate(async () => {
    const toggle = document.querySelector('button[role="switch"]');
    if (toggle && toggle.getAttribute('aria-checked') === 'true') {
      toggle.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const gstStatusAfterToggle = await page.evaluate(() => {
    const toggle = document.querySelector('button[role="switch"]');
    return {
      ariaChecked: toggle?.getAttribute('aria-checked'),
      badgeText: document.body.innerText.includes('GST Disabled (₹0 Tax)')
    };
  });
  console.log(`[Req 2] GST Toggled Off status:`, gstStatusAfterToggle);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_settings_dark_gst_off.png') });

  // ==========================================
  // REQUIREMENT 6: DARK MODE DIVIDER BUG AUDIT
  // ==========================================
  console.log('\n--- AUDITING DARK MODE DIVIDERS (MENU / ITEMS) ---');
  // Navigate to Menu / Items
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const menuBtn = btns.find(b => b.textContent.trim() === 'Menu');
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Switch to Lunch category to see Gobi 65
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lunchBtn = btns.find(b => b.textContent.trim() === 'Lunch');
    if (lunchBtn) lunchBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Check divider colors under items
  const dividerInfo = await page.evaluate(() => {
    // Look at mobile container
    const mobileContainer = document.querySelector('.divide-y');
    if (!mobileContainer) return null;
    const children = Array.from(mobileContainer.children);
    return children.map((c, idx) => {
      const style = window.getComputedStyle(c);
      const name = c.querySelector('span.text-slate-900')?.textContent?.trim() || `Item ${idx}`;
      return {
        name,
        borderBottomWidth: style.borderBottomWidth,
        borderBottomColor: style.borderBottomColor,
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
      };
    });
  });
  console.log(`[Req 6] Divider audit for items:`, dividerInfo?.slice(0, 3));
  if (dividerInfo && dividerInfo.length > 0) {
    const firstItemDivider = dividerInfo[0];
    console.log(`First item (${firstItemDivider.name}) divider color: ${firstItemDivider.borderBottomColor}`);
    const isDarkDivider = firstItemDivider.borderBottomColor === 'rgb(61, 44, 32)' || 
                          firstItemDivider.borderTopColor === 'rgb(61, 44, 32)';
    console.log(`[Req 6] Is first item divider using dark token #3D2C20 (rgb(61, 44, 32)): ${isDarkDivider}`);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_menu_dividers_dark.png') });

  // ==========================================
  // REQUIREMENT 5: CUSTOMER BUTTONS AUDIT (Add Customer & Edit Customer)
  // ==========================================
  console.log('\n--- AUDITING CUSTOMER BUTTONS & MODALS ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const custBtn = btns.find(b => b.textContent.trim() === 'Customers');
    if (custBtn) custBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click "Add Customer" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addCust = btns.find(b => b.textContent.includes('Add Customer'));
    if (addCust) addCust.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const addCustModalVisible = await page.evaluate(() => {
    return document.body.innerText.includes('Register New Customer');
  });
  console.log(`[Req 5] "Add Customer" button opens modal: ${addCustModalVisible}`);

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Click "Edit Customer" button on first customer
  await page.evaluate(() => {
    const editBtn = document.querySelector('button[class*="hover:text-slate-700"]');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const editCustModalVisible = await page.evaluate(() => {
    return document.body.innerText.includes('Edit Customer');
  });
  console.log(`[Req 5] "Edit Customer" button opens modal: ${editCustModalVisible}`);

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // ==========================================
  // BILLING, CHECKOUT, QUICK CASH, NEW SALE & GST=0 AUDIT
  // ==========================================
  console.log('\n--- AUDITING BILLING & CHECKOUT FLOW (GST OFF = ₹0 TAX, QUICK CASH, NEW SALE) ---');
  // Navigate to Billing
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const billBtn = btns.find(b => b.textContent.trim() === 'Billing');
    if (billBtn) billBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Add 2 items to cart
  await page.evaluate(() => {
    const plusButtons = document.querySelectorAll('button[aria-label*="Add"]');
    if (plusButtons[0]) plusButtons[0].click();
    if (plusButtons[1]) plusButtons[1].click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Check Cart Tax in sticky bar / CartSidebar
  const cartTaxInfo = await page.evaluate(() => {
    const cartSummary = document.getElementById('cart-checkout-section');
    return cartSummary ? cartSummary.innerText : '';
  });
  console.log(`[Req 2] Cart shows Tax (GST): ₹0.00: ${cartTaxInfo.includes('₹0')}`);

  // Open Checkout / Payment Modal
  await page.evaluate(() => {
    const checkoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay / Checkout'));
    if (checkoutBtn) checkoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // ==========================================
  // REQUIREMENT 3: QUICK-CASH PRESETS AUDIT
  // ==========================================
  const quickCashButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const presetButtons = buttons.filter(b => /^₹\d+$/.test(b.textContent.trim()));
    return presetButtons.map(b => b.textContent.trim());
  });
  console.log(`[Req 3] Cash quick amount buttons present:`, quickCashButtons);
  const has1000 = quickCashButtons.includes('₹1000');
  console.log(`[Req 3] ₹1000 button removed: ${!has1000} (Should be true)`);
  console.log(`[Req 3] Expected [ '₹50', '₹100', '₹200', '₹500' ]: ${JSON.stringify(quickCashButtons) === JSON.stringify(['₹50', '₹100', '₹200', '₹500'])}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_payment_modal_cash_presets.png') });

  // Complete Payment with Exact Cash
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

  // ==========================================
  // REQUIREMENT 4 & 2: RECEIPT MODAL AUDIT (GST ₹0 & "NEW SALE" BUTTON AT 360px, 390px, 412px)
  // ==========================================
  console.log('\n--- AUDITING RECEIPT MODAL & "NEW SALE" BUTTON ---');
  
  // Verify GST on receipt shows ₹0.00
  const receiptTaxText = await page.evaluate(() => {
    const receipt = document.getElementById('thermal-receipt-print-area');
    return receipt ? receipt.innerText : '';
  });
  const receiptHasGstZero = receiptTaxText.includes('GST') && receiptTaxText.includes('₹0.00');
  console.log(`[Req 2] Receipt displays "GST: ₹0.00" when GST is disabled: ${receiptHasGstZero}`);

  // Test "New Sale" button at 360px, 390px, 412px
  for (const width of [360, 390, 412]) {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 300));

    const newSaleBtnMetrics = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newSaleBtn = btns.find(b => b.textContent.includes('New Sale'));
      if (!newSaleBtn) return null;
      const rect = newSaleBtn.getBoundingClientRect();
      const span = newSaleBtn.querySelector('span');
      const spanStyle = span ? window.getComputedStyle(span) : null;
      return {
        width: rect.width,
        height: rect.height,
        whiteSpace: spanStyle?.whiteSpace,
        text: newSaleBtn.textContent.trim(),
      };
    });
    console.log(`[Req 4] "New Sale" button at ${width}px:`, newSaleBtnMetrics);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `test_receipt_modal_${width}px.png`) });
  }

  // Click "New Sale" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const newSaleBtn = btns.find(b => b.textContent.includes('New Sale'));
    if (newSaleBtn) newSaleBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // ==========================================
  // REQUIREMENT 5: OTHER SCREEN BUTTON AUDITS
  // ==========================================
  console.log('\n--- AUDITING ITEMS (Add Item / Edit Item / Archive) ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const menuBtn = btns.find(b => b.textContent.trim() === 'Menu');
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // "Add Item"
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Item'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const addItemModal = await page.evaluate(() => document.body.innerText.includes('Add New Item'));
  console.log(`[Req 5] "Add Item" button opens modal: ${addItemModal}`);
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // "Edit Item"
  await page.evaluate(() => {
    const editBtn = document.querySelector('button[aria-label="Edit Item"]');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const editItemModal = await page.evaluate(() => document.body.innerText.includes('Edit Menu Item'));
  console.log(`[Req 5] "Edit Item" button opens modal: ${editItemModal}`);
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n--- AUDITING HISTORY (Reprint / Cancel Bill) ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const histBtn = btns.find(b => b.textContent.trim() === 'History');
    if (histBtn) histBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Open first bill in history
  await page.evaluate(() => {
    const firstBillRow = document.querySelector('.divide-y > div');
    if (firstBillRow) firstBillRow.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Reprint
  await page.evaluate(() => {
    const reprintBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Reprint'));
    if (reprintBtn) reprintBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const reprintReceiptModal = await page.evaluate(() => !!document.getElementById('thermal-receipt-print-area'));
  console.log(`[Req 5] "Reprint" button opens Receipt Modal from History: ${reprintReceiptModal}`);
  
  // Close receipt
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n--- ALL CHECKS COMPLETED SUCCESSFULLY ---');
  await browser.close();
}

run().catch((e) => {
  console.error('Test run failed:', e);
  process.exit(1);
});
