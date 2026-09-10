const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function check() {
  console.log('Testing Supabase fallback...');
  
  const testId = `file-${Date.now()}`;
  const buffer = Buffer.from('TEST DOCUMENT BINARY DATA');
  
  console.log('1. Uploading binary...');
  const { error: upErr } = await supabase.storage.from('evidence-files').upload(testId, buffer, { contentType: 'text/plain' });
  if (upErr) {
    console.error('Upload failed:', upErr);
    return;
  }
  console.log('Upload success.');
  
  console.log('2. Downloading binary...');
  const { data, error: dlErr } = await supabase.storage.from('evidence-files').download(testId);
  if (dlErr) {
    console.error('Download failed:', dlErr);
    return;
  }
  
  const text = await data.text();
  console.log('Download success. Content:', text);
  
  if (text === 'TEST DOCUMENT BINARY DATA') {
    console.log('BINARY VERIFIED.');
  }
}
check();
