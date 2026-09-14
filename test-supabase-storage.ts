import { getSupabaseServerClient } from './src/lib/supabaseServer.js';
import * as fs from 'fs';

async function testStorage() {
  const supabase = getSupabaseServerClient();
  const buffer = Buffer.from('test docx content ' + Date.now());
  
  console.log('Uploading test file to evidence-files bucket...');
  const { data, error } = await supabase.storage.from('evidence-files').upload('test-docs/test-file.docx', buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: true
  });
  
  if (error) {
    console.error('Upload Error:', error);
    return;
  }
  console.log('Uploaded Data:', data);
  
  console.log('Downloading test file from evidence-files bucket...');
  const { data: dlData, error: dlError } = await supabase.storage.from('evidence-files').download(data.path);
  
  if (dlError) {
    console.error('Download Error:', dlError);
    return;
  }
  const text = await dlData.text();
  console.log('Downloaded Text:', text);
}

testStorage().catch(console.error);
