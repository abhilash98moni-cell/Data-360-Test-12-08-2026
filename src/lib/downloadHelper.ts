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

    const downloadUrl = `/api/storage/download/${encodeURIComponent(targetFileId)}`;
    const response = await fetch(downloadUrl);

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
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

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
