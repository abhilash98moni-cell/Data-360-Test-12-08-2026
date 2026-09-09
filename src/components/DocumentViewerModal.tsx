import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet, File, Table, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentViewerModalProps {
  doc: {
    id?: string;
    name: string;
    type?: string;
    size?: string | number;
    url?: string;
    dataUrl?: string;
    googleDriveFileId?: string;
    uploadDate?: string;
  } | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ doc, onClose }) => {
  const [sheetData, setSheetData] = useState<{ [sheetName: string]: any[][] } | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);
  const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isSpreadsheet = Boolean(
    doc?.name && (
      doc.name.toLowerCase().endsWith('.xlsx') ||
      doc.name.toLowerCase().endsWith('.xls') ||
      doc.name.toLowerCase().endsWith('.csv') ||
      doc.type?.includes('spreadsheet') ||
      doc.type?.includes('excel') ||
      doc.type?.includes('csv')
    )
  );

  const isImage = Boolean(
    doc && (
      doc.type?.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.name)
    )
  );

  const isPdf = Boolean(
    doc && (
      doc.type === 'application/pdf' ||
      doc.name?.toLowerCase().endsWith('.pdf')
    )
  );

  const downloadUrl = doc
    ? (doc.url || (doc.googleDriveFileId ? `/api/storage/download/${encodeURIComponent(doc.googleDriveFileId)}?fileName=${encodeURIComponent(doc.name)}` : '') || doc.dataUrl || '#')
    : '#';

  const previewUrl = doc
    ? (doc.dataUrl || (doc.url ? doc.url.replace('/download/', '/preview/') : (doc.googleDriveFileId ? `/api/storage/preview/${encodeURIComponent(doc.googleDriveFileId)}?fileName=${encodeURIComponent(doc.name)}` : '')))
    : '';

  useEffect(() => {
    if (!doc || !isSpreadsheet) {
      setSheetData(null);
      setSheetNames([]);
      setActiveSheet('');
      setSpreadsheetError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSpreadsheet(true);
    setSpreadsheetError(null);

    const loadSpreadsheet = async () => {
      try {
        const XLSX = await import('xlsx');
        let arrayBuffer: ArrayBuffer | null = null;

        if (doc.dataUrl && doc.dataUrl.includes('base64,')) {
          const base64Data = doc.dataUrl.split('base64,')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          const fetchTarget = previewUrl || downloadUrl;
          if (fetchTarget && fetchTarget !== '#') {
            const res = await fetch(fetchTarget);
            if (!res.ok) {
              throw new Error(`Failed to fetch file stream (HTTP ${res.status})`);
            }
            arrayBuffer = await res.arrayBuffer();
          }
        }

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('Spreadsheet data is empty or could not be loaded');
        }

        const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('Workbook contains no sheets');
        }

        const parsedSheets: { [name: string]: any[][] } = {};
        wb.SheetNames.forEach((name) => {
          const sheet = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
          parsedSheets[name] = rows;
        });

        if (isMounted) {
          setSheetData(parsedSheets);
          setSheetNames(wb.SheetNames);
          setActiveSheet(wb.SheetNames[0]);
          setIsLoadingSpreadsheet(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Spreadsheet rendering fallback notice:', err.message);
          setSpreadsheetError(err.message || 'Could not parse spreadsheet structure.');
          setIsLoadingSpreadsheet(false);
        }
      }
    };

    loadSpreadsheet();

    return () => {
      isMounted = false;
    };
  }, [doc, isSpreadsheet, previewUrl, downloadUrl]);

  if (!doc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeaderIcon = () => {
    if (isSpreadsheet) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (isImage) return <ImageIcon className="w-5 h-5 text-amber-400" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  const activeRows = sheetData && activeSheet ? sheetData[activeSheet] || [] : [];
  const headerRow = activeRows.length > 0 ? activeRows[0] : [];
  const dataRows = activeRows.length > 1 ? activeRows.slice(1) : [];

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shrink-0">
              {getHeaderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-md" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{doc.size ? `${doc.size}` : 'Production Document'}</span>
                {doc.uploadDate && (
                  <>
                    <span>•</span>
                    <span>{new Date(doc.uploadDate).toLocaleString()}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              title="Download actual uploaded file"
            >
              <Download className="w-4 h-4" />
              <span>Download Original</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Viewer Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/60 min-h-[400px]">
          {isImage ? (
            <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
              <img
                src={previewUrl || downloadUrl}
                alt={doc.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-800 shadow-xl"
              />
            </div>
          ) : isPdf ? (
            <div className="flex-1 w-full h-full p-2">
              <iframe
                src={previewUrl || downloadUrl}
                title={doc.name}
                className="w-full h-full min-h-[550px] rounded-xl border border-slate-800 bg-white"
              />
            </div>
          ) : isSpreadsheet ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sheet tabs and summary header */}
              <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-xl">
                  {sheetNames.map((sName) => (
                    <button
                      key={sName}
                      type="button"
                      onClick={() => setActiveSheet(sName)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                        activeSheet === sName
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700'
                      }`}
                    >
                      <Table className="w-3 h-3 inline-block mr-1.5 text-emerald-400" />
                      {sName}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>{dataRows.length} data rows</span>
                  <span>•</span>
                  <span>{headerRow.length} columns</span>
                </div>
              </div>

              {/* Sheet table viewport */}
              <div className="flex-1 overflow-auto p-4">
                {isLoadingSpreadsheet ? (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-medium">Parsing uploaded spreadsheet...</p>
                  </div>
                ) : spreadsheetError ? (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-200">Notice: {spreadsheetError}</p>
                    <p className="text-xs text-slate-400 max-w-md">
                      You can download and inspect the complete raw file using your local spreadsheet software.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download {doc.name}
                    </button>
                  </div>
                ) : activeRows.length === 0 ? (
                  <div className="h-full min-h-[350px] flex items-center justify-center text-xs text-slate-500 italic">
                    This worksheet contains no rows.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-x-auto shadow-inner bg-slate-900/80">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 sticky top-0">
                          <th className="py-2.5 px-3 font-mono text-[10px] text-slate-600 border-r border-slate-800/80 w-12 text-center select-none">
                            #
                          </th>
                          {headerRow.map((cell: any, cIdx: number) => (
                            <th
                              key={`th-${cIdx}`}
                              className="py-2.5 px-3 font-bold text-slate-300 border-r border-slate-800/60 last:border-r-0"
                            >
                              {String(cell || `Col ${cIdx + 1}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {dataRows.map((row: any[], rIdx: number) => (
                          <tr key={`tr-${rIdx}`} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 text-[10px] text-slate-600 bg-slate-950/40 border-r border-slate-800/80 text-center select-none font-sans">
                              {rIdx + 1}
                            </td>
                            {headerRow.map((_: any, cIdx: number) => {
                              const val = row[cIdx];
                              const displayVal = val !== undefined && val !== null ? String(val) : '';
                              return (
                                <td
                                  key={`td-${rIdx}-${cIdx}`}
                                  className="py-2 px-3 text-slate-300 border-r border-slate-800/40 last:border-r-0"
                                >
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                {getHeaderIcon()}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">{doc.name}</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Binary document ({doc.type || 'attachment'}). Ready for inspection in external applications.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Original File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
