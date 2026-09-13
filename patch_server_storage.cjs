const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Ensure archiver is imported
if (!content.includes("import archiver")) {
    content = content.replace("import express", "import archiver from 'archiver';\nimport express");
}

// Define the getAuthorizedEvidenceRecord function right before the download endpoints
const authLogic = `
async function getAuthorizedEvidenceRecord(fileId: string, req: any) {
    const isDistributor = req.auth?.role === 'Distributor' || String(req.auth?.role).includes('Distributor');
    const userOrg = req.auth?.organization || '';
    const reqDistributor = req.query.distributor || req.body.distributor;
    
    const supabase = getSupabaseServerClient();
    const { data: logs } = await supabase.from('system_audit_logs')
        .select('*')
        .eq('event_type', 'EVIDENCE_FILE')
        .order('created_at', { ascending: false });

    let dbStoreLogs = [];
    try {
        dbStoreLogs = await dbStore.getAuditLogs('EVIDENCE_FILE');
    } catch(e) {}

    const allLogs = [...(logs || []), ...dbStoreLogs];
    
    const record = allLogs.find((l: any) => {
        const d = l.details || {};
        return d.googleDriveFileId === fileId || l.id === fileId;
    });

    if (!record) return null;

    const distName = record.details?.distributorName || '';

    if (isDistributor) {
        if (distName.toLowerCase() !== userOrg.toLowerCase()) return null;
    } else {
        if (reqDistributor && reqDistributor !== 'All Distributors') {
             if (distName.toLowerCase() !== reqDistributor.toLowerCase()) return null;
        }
    }

    return record;
}

`;

content = content.replace(
  "app.get('/api/storage/download/:fileId'",
  authLogic + "app.get('/api/storage/download/:fileId'"
);

// Replace download and preview endpoints
content = content.replace(
    /app\.get\('\/api\/storage\/download\/:fileId', async \(req, res\) => {[\s\S]*?}\);/,
    `app.get('/api/storage/download/:fileId', authenticateRequest, async (req: any, res: any) => {
    try {
        const { fileId } = req.params;
        const record = await getAuthorizedEvidenceRecord(fileId, req);
        if (!record) {
             return res.status(403).json({ error: 'Unauthorized or file not found' });
        }
        const realFileId = record.details?.googleDriveFileId || fileId;
        
        if (realFileId.startsWith('EVD-') || realFileId.startsWith('ev-')) {
             return res.status(404).json({ error: 'File unavailable. This is a legacy record without a real file attachment.' });
        }

        const fallbackFileName = record.details?.fileName || req.query.fileName as string;
        const downloaded = await storageService.downloadFile(realFileId, fallbackFileName);
        
        if (!downloaded || !downloaded.buffer) {
             return res.status(404).json({ error: 'File unavailable in storage.' });
        }

        res.setHeader('Content-Type', downloaded.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', \`attachment; filename="\${encodeURIComponent(downloaded.fileName)}"\`);
        res.send(downloaded.buffer);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to download file', details: err.message });
    }
  });`
);

content = content.replace(
    /app\.get\('\/api\/storage\/preview\/:fileId', async \(req, res\) => {[\s\S]*?}\);/,
    `app.get('/api/storage/preview/:fileId', authenticateRequest, async (req: any, res: any) => {
    try {
        const { fileId } = req.params;
        const record = await getAuthorizedEvidenceRecord(fileId, req);
        if (!record) {
             return res.status(403).json({ error: 'Unauthorized or file not found' });
        }
        const realFileId = record.details?.googleDriveFileId || fileId;
        
        if (realFileId.startsWith('EVD-') || realFileId.startsWith('ev-')) {
             return res.status(404).json({ error: 'File unavailable. This is a legacy record without a real file attachment.' });
        }

        const fallbackFileName = record.details?.fileName || req.query.fileName as string;
        const downloaded = await storageService.downloadFile(realFileId, fallbackFileName);

        if (!downloaded || !downloaded.buffer) {
             return res.status(404).json({ error: 'File unavailable in storage.' });
        }

        let contentType = downloaded.mimeType || 'application/octet-stream';
        if (fallbackFileName.toLowerCase().endsWith('.pdf')) contentType = 'application/pdf';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', \`inline; filename="\${encodeURIComponent(downloaded.fileName).replace(/['()]/g, escape)}"\`);
        res.send(downloaded.buffer);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to preview file' });
    }
  });`
);

// Add bulk download endpoint
const bulkEndpoint = `
  app.post('/api/storage/bulk-download', authenticateRequest, async (req: any, res: any) => {
    try {
      const { fileIds, zipName } = req.body;
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ error: 'No files provided for bulk download' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', \`attachment; filename="\${zipName || 'Evidence_Archive.zip'}"\`);

      const archive = archiver('zip', {
        zlib: { level: 5 }
      });

      archive.on('error', function(err) {
        throw err;
      });

      archive.pipe(res);

      for (const id of fileIds) {
        const record = await getAuthorizedEvidenceRecord(id, req);
        if (record) {
           const realFileId = record.details?.googleDriveFileId || id;
           if (realFileId.startsWith('EVD-') || realFileId.startsWith('ev-')) continue;
           
           try {
             const downloaded = await storageService.downloadFile(realFileId);
             if (downloaded && downloaded.buffer) {
                // Determine folder based on section
                const section = record.details?.section || 'General';
                // Sanitize section name
                const folderName = section.replace(/[<>:"/\\\\|?*]+/g, '').trim();
                const fileName = downloaded.fileName.replace(/[<>:"/\\\\|?*]+/g, '').trim();
                archive.append(downloaded.buffer, { name: \`\${folderName}/\${fileName}\` });
             }
           } catch(e) {
             console.error('Failed to add file to zip', id, e);
           }
        }
      }

      await archive.finalize();
    } catch (err: any) {
      console.error('Bulk download error:', err);
      // Can't set status if headers already sent, but typically caught earlier
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create bulk download archive' });
      }
    }
  });
`;

content = content.replace(
    "// Delete file from Google Drive",
    bulkEndpoint + "\n  // Delete file from Google Drive"
);

fs.writeFileSync('server.ts', content);
console.log('patched server.ts');
