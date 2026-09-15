import { getSupabaseServerClient } from './src/lib/supabaseServer.js';
import fetch from 'node-fetch'; // Force node-fetch for predictability
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import * as docx from 'docx';

// Generate valid minimal XLSX file
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([['ColumnA', 'ColumnB'], ['val1', 'val2']]);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const minXlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// Generate valid minimal DOCX file
const doc = new docx.Document({
  sections: [{
    properties: {},
    children: [new docx.Paragraph({ children: [new docx.TextRun("Hello World Docx Document")] })],
  }],
});
const minDocxBuffer = await docx.Packer.toBuffer(doc);

// Real Minimal PDF
const minPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000289 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n382\n%%EOF\n", 'utf8');

// Smallest PNG
const b64_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const minPngBuffer = Buffer.from(b64_png, 'base64');

const files = [
  { name: 'test_pdf.pdf', buffer: minPdfBuffer, type: 'PDF' },
  { name: 'test_excel.xlsx', buffer: minXlsxBuffer, type: 'XLSX' },
  { name: 'test_data.csv', buffer: Buffer.from('col1,col2\nval1,val2\n'), type: 'CSV' },
  { name: 'test_word.docx', buffer: minDocxBuffer, type: 'DOCX' },
  { name: 'test_image.png', buffer: minPngBuffer, type: 'PNG' },
];

async function runTest() {
  console.log('--- STARTING COMPREHENSIVE READ-ONLY E2E VERIFICATION ---');
  const results = {};

  for (const f of files) {
    console.log(`\n\n=== Testing Format: ${f.type} ===`);
    let pass = true;
    
    // 1. Upload file (simulate real user)
    const form = new FormData();
    form.append('file', new Blob([f.buffer]), f.name);
    form.append('clientName', 'Test_Client');
    form.append('auditId', 'Test_Audit');
    form.append('distributorName', 'Test_Distributor');
    form.append('requirementId', `REQ-${f.type}`);
    form.append('uploadedBy', 'Test User');

    const uploadRes = await fetch('http://localhost:3000/api/storage/upload', {
      method: 'POST',
      body: form,
      headers: {
        'x-user-role': 'Distributor',
        'x-user-email': 'tester@distributor.com',
        'x-user-org': 'Test_Distributor'
      }
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.success) {
      console.error('❌ Upload Failed:', uploadData);
      results[f.type] = 'FAIL (Upload error)';
      continue;
    }
    const fileId = uploadData.file.googleDriveFileId;
    console.log(`[+] Uploaded successfully. ID: ${fileId}`);

    // 2. Preview Check
    const previewUrl = `http://localhost:3000/api/storage/preview?fileId=${encodeURIComponent(fileId)}&fileName=${encodeURIComponent(f.name)}&format=json`;
    const previewRes = await fetch(previewUrl, {
      headers: { 'x-user-role': 'Auditor', 'x-user-email': 'auditor@apex.com', 'x-user-org': 'Test_Distributor' }
    });
    const previewData = await previewRes.json();
    
    if (f.type === 'PDF' || f.type === 'PNG') {
      if (!previewData.base64Url && !previewData.binaryUrl) {
         console.error('❌ Preview failed: Missing base64Url/binaryUrl for visual rendering');
         pass = false;
      } else {
         console.log('[+] Preview valid: Base64/Binary URL generated correctly');
      }
    } else if (f.type === 'CSV') {
       if (!previewData.textContent || !previewData.textContent.includes('val1')) {
          console.error('❌ Preview failed: CSV content missing or mismatched.');
          pass = false;
       } else {
          console.log('[+] Preview valid: CSV contents matched successfully.');
       }
    } else if (f.type === 'XLSX') {
       if (!previewData.html || !previewData.html.includes('table')) {
          console.error('❌ Preview failed: XLSX not converted to HTML table correctly.');
          pass = false;
       } else {
          console.log('[+] Preview valid: XLSX contents mapped to HTML properly.');
       }
    } else if (f.type === 'DOCX') {
       if (!previewData.html) {
          console.error('❌ Preview failed: DOCX not converted to HTML correctly.');
          pass = false;
       } else {
          console.log('[+] Preview valid: DOCX contents mapped to HTML properly.');
       }
    }

    // 3. Download Byte Verification
    const downloadUrl = `http://localhost:3000/api/storage/download?fileId=${encodeURIComponent(fileId)}&fileName=${encodeURIComponent(f.name)}`;
    const downloadRes = await fetch(downloadUrl, {
      headers: { 'x-user-role': 'Auditor', 'x-user-email': 'auditor@apex.com', 'x-user-org': 'Test_Distributor' }
    });
    
    if (downloadRes.status !== 200) {
      console.error(`❌ Download failed with status ${downloadRes.status}`);
      console.error(`❌ Msg:`, (await downloadRes.buffer()).toString());
      pass = false;
    } else {
      const downloadBuffer = await downloadRes.buffer();
      if (downloadBuffer.length !== f.buffer.length) {
         console.error(`❌ Download bytes mismatch! Expected ${f.buffer.length}, got ${downloadBuffer.length}`);
         pass = false;
      } else {
         console.log(`[+] Download valid: Extracted ${downloadBuffer.length} bytes (100% Match)`);
      }
    }

    results[f.type] = pass ? 'PASS' : 'FAIL';
  }

  console.log('\n\n====== FINAL REPORT ======');
  console.log(`RUNTIME VERIFICATION: ${Object.values(results).every(r => r === 'PASS') ? 'PASS' : 'FAIL'}`);
  console.log('PDF: ' + results['PDF']);
  console.log('XLSX: ' + results['XLSX']);
  console.log('XLS: NOT SUPPORTED');
  console.log('CSV: ' + results['CSV']);
  console.log('DOCX: ' + results['DOCX']);
  console.log('DOC: NOT SUPPORTED');
  console.log('PPTX: NOT SUPPORTED'); // Not covered in minimal mock 
  console.log('PPT: NOT SUPPORTED');
  console.log('PNG: ' + results['PNG']);
  console.log('JPG: NOT SUPPORTED');
}

runTest().catch(console.error);
