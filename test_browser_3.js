import puppeteer from 'puppeteer';
try {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', response => {
    if (!response.ok()) console.log('FAILED RESPONSE:', response.status(), response.url());
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await browser.close();
} catch (e) {
  console.log('Error launching', e.message);
}
