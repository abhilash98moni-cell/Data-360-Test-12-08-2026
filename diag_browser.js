import puppeteer from 'puppeteer';
try {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  
  const content = await page.content();
  console.log('HTML ROOT CONTENT LENGTH:', content.length);
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 200));
  console.log('ROOT INNER HTML:', rootHtml);
  
  await browser.close();
} catch (e) {
  console.log('Error launching', e.message);
}
