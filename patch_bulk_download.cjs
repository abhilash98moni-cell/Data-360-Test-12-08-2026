const fs = require('fs');
const content = fs.readFileSync('src/lib/downloadHelper.ts', 'utf8');

const bulkFunction = `
export async function bulkDownloadFromApi(
  fileIds: string[],
  zipName: string = 'Evidence_Archive.zip',
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
): Promise<boolean> {
  if (!fileIds || fileIds.length === 0) {
    if (showToast) showToast('No files selected for download.', 'warning');
    return false;
  }
  
  try {
    if (showToast) showToast('Preparing bulk download. This may take a moment...', 'info');
    
    const storageItem = localStorage.getItem('data360_user_session');
    let headers: HeadersInit = {
       'Content-Type': 'application/json'
    };
    let distributorContext = '';
    if (storageItem) {
      try {
        const session = JSON.parse(storageItem);
        if (session.token) {
          headers['Authorization'] = \`Bearer \${session.token}\`;
        }
        headers['x-user-email'] = session.email || '';
        headers['x-user-role'] = session.role || '';
        headers['x-user-organization'] = session.organization || '';
      } catch (e) {}
    }
    
    const selectedDist = localStorage.getItem('data360_selected_distributor');
    if (selectedDist) {
       distributorContext = selectedDist;
    }
    
    const response = await fetch('/api/storage/bulk-download', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileIds, zipName, distributor: distributorContext })
    });
    
    if (!response.ok) {
      let errorMessage = 'Could not create bulk download.';
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch (e) {}
      if (showToast) showToast(\`Bulk download failed: \${errorMessage}\`, 'error');
      else alert(\`Bulk download failed: \${errorMessage}\`);
      return false;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    if (showToast) showToast(\`Successfully downloaded "\${zipName}"\`, 'success');
    return true;
  } catch (err: any) {
    const msg = err.message || 'An unexpected error occurred.';
    if (showToast) showToast(\`Download failed: \${msg}\`, 'error');
    else alert(\`Download failed: \${msg}\`);
    return false;
  }
}
`;

fs.writeFileSync('src/lib/downloadHelper.ts', content + "\n" + bulkFunction);
console.log('patched bulk download helper');
