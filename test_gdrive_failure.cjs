const fs = require('fs');

async function runTests() {
  const SERVER = 'http://localhost:3000';
  fs.writeFileSync('test_distributor.pdf', 'FAKE PDF CONTENT');
  
  console.log('--- TEST 5: Simulate Google Drive failure ---');
  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';
    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="distributorName"\r\n\r\nTest Org A\r\n';
    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="file"; filename="test_distributor.pdf"\r\n';
    body += 'Content-Type: application/pdf\r\n\r\n';
    body += 'FAKE PDF CONTENT\r\n';
    body += '--' + boundary + '--\r\n';

    const res = await fetch(`${SERVER}/api/storage/upload`, {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'x-user-role': 'Distributor',
        'x-user-organization': 'Test Org A'
      }
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error('Test Failed Exception:', err.message);
  }
}
runTests();
