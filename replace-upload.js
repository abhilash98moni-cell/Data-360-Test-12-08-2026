const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

// Find start and end of uploadFile
const uploadStart = code.indexOf('public async uploadFile(');
const getFileMetaStart = code.indexOf('public async resolveMetadata('); // the next method

let newUploadFile = `
  public async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    metadata: {
      clientName: string;
      auditName: string;
      distributorName: string;
      requirementId: string;
      uploadedBy: string;
      isReferenceMaterial?: boolean;
    }
  ): Promise<FileMetadata> {
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const safeClient = sanitize(metadata.clientName || 'Default_Client');
    const safeAudit = sanitize(metadata.auditName || 'Audit_2026');
    const safeDistributor = sanitize(metadata.distributorName || 'Distributor_A');
    const reqRef = sanitize(metadata.requirementId || 'General');
    const safeFileName = sanitize(fileName);
    
    const folderPath = \`\${safeClient}/\${safeAudit}/\${safeDistributor}/\${reqRef}\`;
    const objectPath = \`\${folderPath}/\${Date.now()}_\${safeFileName}\`;
    
    const client = getSupabaseServerClient();
    const { data, error } = await client.storage.from('evidence-files').upload(objectPath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Supabase upload error: ' + error.message);
    }
    
    const fileId = data.path; // Canonical representation

    const fileMeta: FileMetadata = {
      id: fileId,
      googleDriveFileId: fileId, // Using this field to store the Supabase path for compatibility
      googleDriveFolderId: folderPath,
      folderPath: folderPath,
      fileName: fileName,
      fileType: mimeType,
      fileSizeMB: parseFloat((fileBuffer.length / (1024 * 1024)).toFixed(2)),
      uploadedBy: metadata.uploadedBy,
      uploadedDate: new Date().toISOString()
    };
    
    // Legacy fallback insert - Keep it to avoid breaking other parts that rely on it
    try {
      await client.from('system_audit_logs').insert({
        user_name: metadata.uploadedBy,
        user_email: \`\${metadata.uploadedBy.toLowerCase().replace(/\\s+/g, '.')}@data360.com\`,
        user_role: metadata.isReferenceMaterial ? 'Auditor' : 'Distributor',
        organization: metadata.distributorName,
        action: metadata.isReferenceMaterial ? 'Reference File Upload' : 'File Upload',
        ip_address: '127.0.0.1',
        details: \`Uploaded \${fileName} to Supabase (\${folderPath}), Path: \${fileId}\`
      });
    } catch (e) {}

    return fileMeta;
  }
`;

code = code.substring(0, uploadStart) + newUploadFile + "\n  " + code.substring(getFileMetaStart);
fs.writeFileSync('src/services/storageService.ts', code);
