const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

// Replace the fallback to local disk with Supabase storage upload
const uploadFallbackOld = `
      } catch (fallbackErr: any) {
        console.error('Fatal Google Drive upload failure:', fallbackErr.message);
        console.error(\`Google Drive storage upload failed: \${fallbackErr.message || createErr.message}\`);
        // Fallback to local memory instead of failing
        realDriveFileId = \`file-\${Date.now()}\`;
        this.saveBinaryBuffer(realDriveFileId, fileName, mimeType, fileBuffer, [realDriveFileId]);
      }
`;

const uploadFallbackNew = `
      } catch (fallbackErr: any) {
        console.error('Fatal Google Drive upload failure, falling back to Supabase Storage:', fallbackErr.message);
        realDriveFileId = \`file-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`;
        
        try {
          const client = getSupabaseServerClient();
          const { error: sbError } = await client.storage
            .from('evidence-files')
            .upload(realDriveFileId, fileBuffer, {
              contentType: mimeType || 'application/octet-stream',
              upsert: true
            });
          
          if (sbError) {
            console.error('Supabase Storage fallback also failed:', sbError.message);
            throw new Error('All storage layers failed to persist binary.');
          }
          console.log(\`✅ File '\${fileName}' uploaded to Supabase Storage fallback. Object ID: \${realDriveFileId}\`);
        } catch (sbCatchErr: any) {
          console.error('Exception during Supabase Storage fallback:', sbCatchErr);
          throw new Error('Storage completely unavailable.');
        }
      }
`;

code = code.replace(uploadFallbackOld, uploadFallbackNew);

// Now update the resolveBinary function to check Supabase Storage
const resolveBinaryOld = `
    // 3. Scan uploads directory meta files for matches
    try {
      if (fs.existsSync(this.uploadsDir)) {
`;

const resolveBinaryNew = `
    // 2.5. Check Supabase Storage fallback
    if (fileId && (fileId.startsWith('file-') || fileId.startsWith('ev-'))) {
      try {
        const client = getSupabaseServerClient();
        
        // Use service key to download directly from the bucket
        const { data: blob, error } = await client.storage
          .from('evidence-files')
          .download(fileId);
          
        if (!error && blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const entry = { buffer, fileName: fallbackFileName || \`Document_\${fileId}.pdf\`, mimeType: blob.type || 'application/octet-stream' };
          this.binaryBufferStore.set(fileId, entry);
          return entry;
        }
      } catch (sbErr) {
        console.warn('Supabase Storage lookup failed:', sbErr);
      }
    }

    // 3. Scan uploads directory meta files for matches
    try {
      if (fs.existsSync(this.uploadsDir)) {
`;

code = code.replace(resolveBinaryOld, resolveBinaryNew);

fs.writeFileSync('src/services/storageService.ts', code);
