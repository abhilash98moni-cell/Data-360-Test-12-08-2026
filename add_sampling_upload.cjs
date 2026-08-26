const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = `  app.get('/api/evidence', authenticateRequest, async (req: any, res: any) => {`;

const insertion = `  // Sampling Population Upload Endpoint
  app.post('/api/sampling/upload', upload.single('file'), authenticateRequest, async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const {
        clientName = 'Apex Electronics Corp',
        auditId = 'eng-101',
        auditCode = 'AUD-2026-001',
        distributorName = 'Midwest Trading Co.',
        auditPeriod = 'FY 2025-26',
        populationType = 'Transaction Testing Population'
      } = req.body;

      const uploadedBy = req.auth.name || 'Auditor User';
      const targetDistributor = distributorName;

      const metadata = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          clientName,
          auditName: auditId,
          distributorName: targetDistributor,
          requirementId: 'SAMPLING-UPLOAD',
          uploadedBy,
          isReferenceMaterial: false
        }
      );

      const supabase = getSupabaseServerClient();
      
      const newEvidenceRow = {
        client_name: clientName,
        audit_id: auditId,
        audit_code: auditCode,
        distributor_name: targetDistributor,
        requirement_ref: 'SAMPLING',
        requirement_title: populationType,
        section: 'Sampling',
        file_name: metadata.fileName,
        file_size_mb: metadata.fileSizeMB,
        file_type: req.file.mimetype,
        google_drive_file_id: metadata.googleDriveFileId,
        google_drive_folder_id: metadata.googleDriveFolderId,
        storage_path: metadata.folderPath,
        version: 1,
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
        status: 'AVAILABLE',
        review_status: 'ACCEPTED',
        uploader_role: req.auth.role || 'Auditor',
        audit_period: auditPeriod,
        document_type: 'SAMPLING_POPULATION',
        document_usage: ['SAMPLING_POPULATION'],
        samplingEnabled: true,
        samplingStatus: 'ADDED',
        source: 'Auditor Upload'
      };

      const insertEvidenceRes = await supabase.from('system_audit_logs').insert({
        event_type: 'EVIDENCE_FILE',
        target_user_email: \`\${clientName}::\${targetDistributor}\`,
        details: newEvidenceRow,
        created_at: new Date().toISOString()
      }).select().single();

      if (insertEvidenceRes.error) {
        return res.status(500).json({ success: false, error: insertEvidenceRes.error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Sampling population uploaded successfully',
        fileId: metadata.googleDriveFileId
      });
    } catch (error: any) {
      console.error('Sampling upload error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to upload sampling population' });
    }
  });

`;

if (!code.includes('/api/sampling/upload')) {
  code = code.replace(anchor, insertion + anchor);
  fs.writeFileSync('server.ts', code);
  console.log("Endpoint added.");
} else {
  console.log("Endpoint already exists.");
}
