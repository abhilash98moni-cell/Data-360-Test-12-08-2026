import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PdfTemplateViewerProps {
  pdfUrl: string;
  fileName: string;
  onDownload?: () => void;
}

export const PdfTemplateViewer: React.FC<PdfTemplateViewerProps> = ({
  pdfUrl,
  fileName,
  onDownload
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [page: number]: HTMLCanvasElement | null }>({});
  const renderTasksRef = useRef<{ [page: number]: any }>({});

  // Load PDF Document
  const loadPdf = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cancel any ongoing renders
      Object.values(renderTasksRef.current).forEach((task: any) => {
        try {
          if (task && typeof task.cancel === 'function') task.cancel();
        } catch (_) {}
      });
      renderTasksRef.current = {};

      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setNumPages(loadedDoc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to load PDF document:', err);
      setError(err?.message || 'Could not load PDF template file.');
    } finally {
      setLoading(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    loadPdf();
    return () => {
      Object.values(renderTasksRef.current).forEach((task: any) => {
        try {
          if (task && typeof task.cancel === 'function') task.cancel();
        } catch (_) {}
      });
      renderTasksRef.current = {};
    };
  }, [loadPdf]);

  // Render a specific page
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      try {
        // Cancel existing task for this page
        if (renderTasksRef.current[pageNumber]) {
          try {
            renderTasksRef.current[pageNumber].cancel();
          } catch (_) {}
          renderTasksRef.current[pageNumber] = null;
        }

        const page = await pdfDoc.getPage(pageNumber);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNumber] = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, scale]
  );

  // Re-render pages when doc or scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    for (let i = 1; i <= numPages; i++) {
      renderPage(i);
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // Handle zoom
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.7));
  };

  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 48; // padding
    if (containerWidth > 300) {
      // Standard A4 width is ~595pt.
      const fitScale = Math.max(0.8, Math.min(containerWidth / 650, 1.8));
      setScale(fitScale);
    } else {
      setScale(1.0);
    }
  };

  const scrollToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
    const canvas = canvasRefs.current[pageNum];
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border-b border-slate-800 shrink-0">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-200 truncate">{fileName}</div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">Official Auditor Reference PDF</span>
              <span>•</span>
              <span>{numPages > 0 ? `${numPages} ${numPages === 1 ? 'Page' : 'Pages'}` : 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Center: Pagination Controls */}
        {numPages > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Right: Zoom & Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 w-11 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFitWidth}
              className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors border-l border-slate-800 ml-1 pl-1.5"
              title="Fit to Width"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Open in New Tab */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open original PDF in browser tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </a>

          {/* Download Button */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Download PDF document"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Document Viewer Area */}
      <div
        ref={containerRef}
        className="w-full h-[640px] overflow-auto bg-slate-950/80 p-6 flex flex-col items-center gap-6"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-xs font-medium">Loading high-resolution PDF template...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center max-w-md p-6 bg-slate-900 rounded-xl border border-rose-900/50">
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">Unable to load inline preview</h4>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={loadPdf}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open PDF Directly
              </a>
            </div>
          </div>
        )}

        {!loading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-6 w-full">
            {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
              <div
                key={pageNum}
                className="flex flex-col items-center group relative shadow-2xl rounded-sm transition-transform"
              >
                {/* Page Badge */}
                {numPages > 1 && (
                  <div className="self-start mb-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800">
                    Page {pageNum} of {numPages}
                  </div>
                )}
                <div className="rounded border border-slate-700/80 bg-white overflow-hidden shadow-2xl">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[pageNum] = el;
                    }}
                    className="block max-w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
