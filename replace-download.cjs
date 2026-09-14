const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const downloadStart = code.indexOf('public async downloadFile(');
const getFileMetaStart = code.indexOf('public async getFileMetadata(');

let newDownloadFile = `
  public async downloadFile(fileId: string, fallbackFileName?: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const cleanId = fileId.startsWith('ev-') ? fileId.replace(/^ev-/, '') : fileId;
    
    // First, check legacy local cache for dev testing (so we don't break earlier tests)
    const cached = this.getBinaryBuffer(cleanId) || this.getBinaryBuffer(fileId) || (fallbackFileName ? this.getBinaryBuffer(fallbackFileName) : null);
    if (cached) {
      return {
        buffer: cached.buffer,
        fileName: cached.fileName || fallbackFileName || cleanId,
        mimeType: cached.mimeType || 'application/octet-stream'
      };
    }

    if (cleanId.startsWith('gdrive-') || !cleanId.includes('/')) {
      throw new Error(\`Legacy-record error: The requested file uses a legacy file ID ('\${fileId}') and is not accessible in Supabase Storage.\`);
    }
    
    const client = getSupabaseServerClient();
    const { data, error } = await client.storage.from('evidence-files').download(cleanId);
    
    if (error || !data) {
      console.error('Supabase download error:', error);
      throw new Error(\`Failed to download file \${cleanId} from Supabase: \${error?.message || 'Unknown error'}\`);
    }
    
    const buffer = Buffer.from(await data.arrayBuffer());
    let mimeType = data.type || 'application/octet-stream';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Just in case it's missed, force standard docx mimetype if file is docx
    }
    let fileName = fallbackFileName || cleanId.split('/').pop() || 'document';
    
    return {
      buffer,
      fileName,
      mimeType
    };
  }
`;

code = code.substring(0, downloadStart) + newDownloadFile + "\n  " + code.substring(getFileMetaStart);
fs.writeFileSync('src/services/storageService.ts', code);
