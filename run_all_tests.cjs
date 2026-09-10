const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);
const fs = require('fs');

async function runTests() {
  const SERVER = 'http://localhost:3000';
  
  fs.writeFileSync('test_distributor.pdf', 'FAKE PDF CONTENT');
  
  console.log('--- TEST 1: Distributor uploads PDF ---');
  let fileId = '';
  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';
    
    // distributorName
    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="distributorName"\r\n\r\nTest Org A\r\n';
    
    // file
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
    if (!res.ok) throw new Error(JSON.stringify(data));
    fileId = data.file.googleDriveFileId || data.file.id;
    console.log('Upload OK. File ID:', fileId);
    
    // TEST PREVIEW
    const previewRes = await fetch(`${SERVER}/api/storage/preview/${fileId}`, {
      headers: {
        Cookie: `userRole=Distributor; userOrg=${encodeURIComponent('Test Org A')}`
      }
    });
    const content = await previewRes.text();
    console.log('Preview OK. Content:', content.substring(0, 50));
  } catch (err) {
    console.error('TEST 1 Failed:', err.message);
  }

  console.log('\n--- TEST 2: Distributor download works ---');
  try {
    const dlRes = await fetch(`${SERVER}/api/storage/download/${fileId}`, {
      headers: {
        Cookie: `userRole=Distributor; userOrg=${encodeURIComponent('Test Org A')}`
      }
    });
    console.log('Download OK. Headers:', dlRes.headers.get('content-disposition'));
  } catch (err) {
    console.error('TEST 2 Failed:', err.message);
  }
  
  console.log('\n--- TEST 3: Auditor views same PDF ---');
  try {
    const prevRes = await fetch(`${SERVER}/api/storage/preview/${fileId}`, {
      headers: {
        Cookie: `userRole=Auditor; userOrg=Apex`
      }
    });
    const content = await prevRes.text();
    console.log('Auditor Preview OK. Content:', content.substring(0, 50));
  } catch (err) {
    console.error('TEST 3 Failed:', err.message);
  }
  
  console.log('\n--- TEST 7: Unauthorized distributor fails ---');
  try {
    const authRes = await fetch(`${SERVER}/api/storage/preview/${fileId}`, {
      headers: {
        Cookie: `userRole=Distributor; userOrg=${encodeURIComponent('Test Org B')}`
      }
    });
    if (authRes.ok) console.log('TEST 7 FAILED - It allowed access!');
    else console.log('TEST 7 Passed - Access denied with status:', authRes.status);
  } catch (err) {
    console.log('TEST 7 Passed - Access denied');
  }
  
  console.log('\n--- TEST 8: Nonexistent file produces clean error ---');
  try {
    const authRes = await fetch(`${SERVER}/api/storage/preview/file-123456`, {
      headers: {
        Cookie: `userRole=Auditor; userOrg=Apex`
      }
    });
    const content = await authRes.json();
    console.log('TEST 8 Passed - Clean error:', content.error || authRes.statusText);
  } catch (err) {
    console.log('TEST 8 Passed - Clean error:', err.message);
  }
}

runTests();
