import puppeteer from 'puppeteer';
try {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT CONTENT:\\n', textContent.substring(0, 500));
  
  await browser.close();
} catch (e) {
  console.log('Error launching', e.message);
}
