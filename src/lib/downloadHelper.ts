export async function downloadFileFromApi(
  targetFileId: string,
  defaultFileName: string = 'Document',
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
): Promise<boolean> {
  if (!targetFileId) {
    if (showToast) showToast('Invalid or missing file ID for download.', 'error');
    return false;
  }

  try {
    if (showToast) showToast(`Preparing download for "${defaultFileName}"...`, 'info');

    const downloadUrl = `/api/storage/download?fileId=${encodeURIComponent(targetFileId)}&fileName=${encodeURIComponent(defaultFileName)}`;
    const token = typeof window !== "undefined" ? (localStorage.getItem("supabase_token") || sessionStorage.getItem("supabase_token")) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(downloadUrl, { headers });

    if (!response.ok) {
      let errorMessage = 'Document binary could not be retrieved from Google Drive.';
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch (e) {
        // Fallback text if response is not JSON
      }

      if (showToast) {
        showToast(`Download failed: ${errorMessage}`, 'error');
      } else {
        alert(`Download failed: ${errorMessage}`);
      }
      return false;
    }

    // Response is OK (HTTP 200). Parse real filename from Content-Disposition header if available.
    let fileName = defaultFileName;
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const filenameMatch = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
      if (filenameMatch && filenameMatch[1]) {
        fileName = decodeURIComponent(filenameMatch[1]);
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 60000);

    if (showToast) showToast(`Successfully downloaded "${fileName}"`, 'success');
    return true;
  } catch (err: any) {
    const msg = err.message || 'An unexpected error occurred during file download.';
    if (showToast) {
      showToast(`Download failed: ${msg}`, 'error');
    } else {
      alert(`Download failed: ${msg}`);
    }
    return false;
  }
}

export async function previewFileFromApi(
  targetFileId: string,
  defaultFileName: string = 'Document',
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
): Promise<boolean> {
  if (!targetFileId) {
    if (showToast) showToast('Invalid or missing file ID for preview.', 'error');
    return false;
  }

  try {
    if (showToast) showToast(`Preparing preview for "${defaultFileName}"...`, 'info');
    
    const previewUrl = `/api/storage/preview?fileId=${encodeURIComponent(targetFileId)}&fileName=${encodeURIComponent(defaultFileName)}`;
    
    const token = typeof window !== "undefined" ? (localStorage.getItem("supabase_token") || sessionStorage.getItem("supabase_token")) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(previewUrl, { headers });

    if (!response.ok) {
      let errorMessage = 'Document could not be retrieved from Google Drive for preview.';
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch (e) {
        // Fallback text if response is not JSON
      }
      
      if (showToast) {
        showToast(`Preview failed: ${errorMessage}`, 'error');
      } else {
        alert(`Preview failed: ${errorMessage}`);
      }
      return false;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Open in new tab
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      if (showToast) showToast('Please allow popups to view the file preview.', 'warning');
    }
    
    // We do not revoke the URL immediately because the new tab needs to load it.
    // It will be cleaned up when the document unloads.
    
    return true;
  } catch (err: any) {
    const msg = err.message || 'An unexpected error occurred during file preview.';
    if (showToast) {
      showToast(`Preview failed: ${msg}`, 'error');
    } else {
      alert(`Preview failed: ${msg}`);
    }
    return false;
  }
}
