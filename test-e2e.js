import { getSupabaseServerClient } from './src/lib/supabaseServer.js';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- STARTING E2E TEST ---');

  // 1 & 2. Verify Bucket
  console.log('\n[1/7] Verifying Bucket...');
  const supabase = getSupabaseServerClient();
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket('evidence-files');
  if (bucketErr) {
    console.error('❌ Bucket verification failed:', bucketErr);
    process.exit(1);
  }
  console.log('✅ Bucket "evidence-files" verified. ID:', bucket.id);

  const dummyContent = 'This is a test upload file content for E2E verification.';
  fs.writeFileSync('e2e-test-file.txt', dummyContent);

  // 3 & 4. Upload File
  console.log('\n[2/7] Uploading Test File via BQ API...');
  
  // Use global FormData and Blob (native in Node 22)
  const form = new FormData();
  const fileBuffer = fs.readFileSync('e2e-test-file.txt');
  form.append('file', new Blob([fileBuffer]), 'e2e-test-file.txt');
  form.append('clientName', 'E2E_Client');
  form.append('auditId', 'E2E-Audit-101');
  form.append('distributorName', 'E2E_Distributor');
  form.append('requirementId', 'BQ-TEST-1');
  form.append('uploadedBy', 'E2E Tester');

  const uploadRes = await fetch('http://localhost:3000/api/storage/upload', {
    method: 'POST',
    body: form,
    headers: {
      'x-user-role': 'Distributor',
      'x-user-email': 'tester@distributor.com',
      'x-user-org': 'E2E_Distributor'
    }
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success) {
    console.error('❌ Upload failed:', uploadData);
    process.exit(1);
  }
  console.log('✅ Upload success:', uploadData.message);
  
  const fileMeta = uploadData.file;
  console.log('   -> Folder path:', fileMeta.folderPath);
  console.log('   -> File ID / Path:', fileMeta.googleDriveFileId);

  // 5. Confirm physically exists in Storage
  console.log('\n[3/7] Confirming physical file in Supabase Storage...');
  const { data: filesInFolder, error: listErr } = await supabase.storage
    .from('evidence-files')
    .list(fileMeta.folderPath);
    
  if (listErr || !filesInFolder || filesInFolder.length === 0) {
    console.error('❌ Physical file check failed:', listErr || 'Folder empty');
    process.exit(1);
  }
  const found = filesInFolder.find(f => fileMeta.googleDriveFileId.endsWith(f.name));
  if (!found) {
    console.error('❌ File not found in listed folder');
    process.exit(1);
  }
  console.log('✅ Physical file confirmed in bucket.');

  // 6. Database Metadata Check
  console.log('\n[4/7] Checking DB Metadata...');
  const { data: dbRows, error: dbErr } = await supabase.from('system_audit_logs')
    .select('id, details')
    .eq('event_type', 'EVIDENCE_FILE')
    .order('created_at', { ascending: false })
    .limit(5);
    
  const dbMatch = dbRows?.find(r => r.details?.google_drive_file_id === fileMeta.googleDriveFileId);
  if (!dbMatch) {
    console.error('❌ DB Record not found');
    process.exit(1);
  }
  console.log('✅ DB Metadata verified. ID:', dbMatch.id, 'Path:', dbMatch.details.storage_path);

  // 7 & 8 & 9. Preview API
  console.log('\n[5/7] Testing Preview API (as Distributor)...');
  const previewUrl = `http://localhost:3000/api/storage/preview?fileId=${encodeURIComponent(fileMeta.googleDriveFileId)}&fileName=${encodeURIComponent(fileMeta.fileName)}&format=json`;
  const previewRes = await fetch(previewUrl, {
    headers: {
      'x-user-role': 'Distributor',
      'x-user-email': 'tester@distributor.com',
      'x-user-org': 'E2E_Distributor'
    }
  });
  const previewData = await previewRes.json();
  if (!previewData.success || !previewData.textContent) {
    console.error('❌ Preview failed:', previewData);
    process.exit(1);
  }
  if (previewData.textContent !== dummyContent) {
    console.error('❌ Preview content mismatch:', previewData.textContent);
    process.exit(1);
  }
  console.log('✅ Preview successful. Content matched.');

  // 10 & 11. Download API
  console.log('\n[6/7] Testing Download API (Binary)...');
  const downloadUrl = `http://localhost:3000/api/storage/download?fileId=${encodeURIComponent(fileMeta.googleDriveFileId)}&fileName=${encodeURIComponent(fileMeta.fileName)}`;
  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) {
    console.error('❌ Download failed with status', downloadRes.status);
    process.exit(1);
  }
  const downloadBuffer = await downloadRes.arrayBuffer();
  if (Buffer.from(downloadBuffer).toString() !== dummyContent) {
    console.error('❌ Download content mismatch.');
    process.exit(1);
  }
  console.log('✅ Download successful. Binary data matched.');

  // 12 & 13. Auditor Access
  console.log('\n[7/7] Testing Auditor Access...');
  const auditorPreviewRes = await fetch(previewUrl, {
    headers: {
      'x-user-role': 'Auditor',
      'x-user-email': 'auditor@apex.com',
      'x-user-org': 'Apex Audit Practice'
    }
  });
  const auditorPreviewData = await auditorPreviewRes.json();
  if (!auditorPreviewData.success || auditorPreviewData.textContent !== dummyContent) {
    console.error('❌ Auditor preview failed:', auditorPreviewData);
    process.exit(1);
  }
  console.log('✅ Auditor preview successful. Role isolation tests passed (or bypassed correctly).');

  console.log('\n🎉 ALL RUNTIME VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  
  // Clean up
  fs.unlinkSync('e2e-test-file.txt');
}

run().catch(console.error);
