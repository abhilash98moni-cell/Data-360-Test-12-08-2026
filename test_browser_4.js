import puppeteer from 'puppeteer';
try {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Click on "Distributor Workspaces" or "Apex Electronics Corp"
  console.log('Logging in...');
  // Find login button and click it
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const loginBtn = btns.find(b => b.textContent.includes('Login as Distributor'));
     if (loginBtn) loginBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Find the workspace button
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const wsBtn = btns.find(b => b.textContent.includes('Distributor Workspaces'));
     if (wsBtn) wsBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
} catch (e) {
  console.log('Error launching', e.message);
}
