const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

// 1. Add uploadedById to the interface and implementation
code = code.replace(
  "uploadedBy: string;\n      isReferenceMaterial?: boolean;",
  "uploadedBy: string;\n      uploadedById?: string;\n      isReferenceMaterial?: boolean;"
);
code = code.replace(
  "uploadedBy: string;\n      isReferenceMaterial?: boolean;",
  "uploadedBy: string;\n      uploadedById?: string;\n      isReferenceMaterial?: boolean;"
);

// 2. Change the DB insert
const oldDbInsert = `    // Also insert into Supabase \`evidence_files\` and \`system_audit_logs\`
    try {
      const client = getSupabaseServerClient();
      await client.from('system_audit_logs').insert({
        user_name: metadata.uploadedBy,
        user_email: \`\${metadata.uploadedBy.toLowerCase().replace(/\\s+/g, '.')}@data360.com\`,
        user_role: isReference ? 'Auditor' : 'Distributor',
        organization: metadata.distributorName,
        action: isReference ? 'Reference File Upload' : 'File Upload',
        ip_address: '127.0.0.1',
        details: \`Uploaded \${fileName} to Google Drive (\${folderPath}), File ID: \${realDriveFileId}\`
      });
    } catch (dbErr: any) {`;

const newDbInsert = `    // Also insert into Supabase \`evidence_files\` and \`system_audit_logs\`
    try {
      const client = getSupabaseServerClient();
      
      // INSERT INTO evidence_files (new canonical schema)
      await client.from('evidence_files').insert({
        id: fileMeta.id,
        file_name: fileName,
        original_name: fileName,
        mime_type: mimeType || 'application/octet-stream',
        file_size_bytes: fileBuffer.length,
        distributor_name: metadata.distributorName,
        google_drive_id: realDriveFileId,
        storage_path: folderPath,
        status: 'UPLOADED',
        uploaded_by: metadata.uploadedById || null
      });

      // INSERT INTO system_audit_logs (legacy/history)
      await client.from('system_audit_logs').insert({
        user_name: metadata.uploadedBy,
        user_email: \`\${metadata.uploadedBy.toLowerCase().replace(/\\s+/g, '.')}@data360.com\`,
        user_role: isReference ? 'Auditor' : 'Distributor',
        organization: metadata.distributorName,
        action: isReference ? 'Reference File Upload' : 'File Upload',
        ip_address: '127.0.0.1',
        details: \`Uploaded \${fileName} to Google Drive (\${folderPath}), File ID: \${realDriveFileId}\`
      });
    } catch (dbErr: any) {`;

code = code.replace(oldDbInsert, newDbInsert);

fs.writeFileSync('src/services/storageService.ts', code);
