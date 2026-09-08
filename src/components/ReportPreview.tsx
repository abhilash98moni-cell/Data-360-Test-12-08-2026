import React, { useMemo } from "react";
import { ReportMetadata } from "../types";

interface ReportPreviewProps {
  documentData: Record<string, string>;
  activeReport: ReportMetadata;
  sections: { id: string; label: string }[];
}

export const generateReportHTML = (
  report: ReportMetadata,
  docData: Record<string, string>,
  sections: { id: string; label: string }[],
  forPrint: boolean = false
) => {
  const sectionsHTML = sections
    .map(
      (s) => `
      <div class="section-${s.id} report-section">
        ${docData[s.id] || ""}
      </div>
    `
    )
    .join("");

  const scriptTag = forPrint
    ? `
        <script>
          window.PagedConfig = {
            auto: false
          };
          window.onload = async () => {
            await window.PagedPolyfill.preview();
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      `
    : `
        <style>
          /* Make it look like a physical document on screen */
          body {
            background-color: #e2e8f0 !important;
          }
          .pagedjs_pages {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            gap: 2rem;
          }
          .pagedjs_page {
            background: white;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            flex-shrink: 0;
            margin: 0 !important;
          }
        </style>
        <script>
          window.PagedConfig = {
            auto: false
          };
          window.onload = async () => {
            await window.PagedPolyfill.preview();
          }
        </script>
      `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Audit_Report_${report.distributorId.replace(/\s+/g, "_")}</title>
      <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
      <style>
        @page {
          size: letter;
          margin: 1in;
          @bottom-center {
            content: "Business Confidential; Not for Distribution Without Approval from Global Compliance Investigations | Page " counter(page) " of " counter(pages);
            font-size: 8pt;
            color: #555;
          }
        }
        
        .report-section { margin-bottom: 3rem; }
        
        body {
          font-family: Arial, sans-serif;
          color: black;
          font-size: 10pt;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          word-wrap: break-word;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-bottom: 1em; 
          table-layout: fixed;
          word-wrap: break-word;
        }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        th, td { 
          border: 1px solid black; 
          padding: 8px; 
          text-align: left; 
          vertical-align: top; 
          overflow-wrap: break-word;
        }
        th { background-color: #f1f5f9; font-weight: bold; }
        h1 { color: #2e5c8a; font-size: 14pt; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #2e5c8a; padding-bottom: 0.25rem; break-after: avoid; }
        h2 { font-size: 12pt; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; text-decoration: underline; break-after: avoid; }
        h3 { font-size: 11pt; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.75rem; break-after: avoid; }
        p { margin-bottom: 0.75rem; }
        ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        hr { display: none; }
        img { max-width: 100%; height: auto; }
        .word-page-break {
          page-break-after: always;
          break-after: page;
          height: 0;
          margin: 0;
          padding: 0;
          border: none !important;
          visibility: hidden;
        }

        /* Detailed findings bordered boxes */
        .section-detailedFindings > ol {
          padding-left: 0;
          list-style: none;
          counter-reset: finding-counter;
        }
        .section-detailedFindings > ol > li {
          border: 1px solid black;
          padding: 16px;
          margin-bottom: 24px;
          counter-increment: finding-counter;
          break-inside: auto;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .section-detailedFindings > ol > li > p:first-child::before {
          content: counter(finding-counter) ". ";
          font-weight: bold;
        }

        .report-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .report-header h1 {
          color: black;
          border: none;
          text-transform: uppercase;
          font-size: 18pt;
          letter-spacing: 1px;
          margin-bottom: 10px;
          break-after: avoid;
        }
        .report-header p {
          margin: 0 0 5px 0;
          font-size: 11pt;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>DISTRIBUTOR AUDIT REPORT</h1>
        <p><strong>Privileged &amp; Confidential</strong></p>
        <p>Distributor: ${report.distributorId}</p>
        <p>Date: ${new Date(report.createdAt).toLocaleDateString()}</p>
      </div>
      ${sectionsHTML}
      ${scriptTag}
    </body>
    </html>
  `;
};

export const ReportPreview = ({ documentData, activeReport, sections }: ReportPreviewProps) => {
  const htmlContent = useMemo(
    () => generateReportHTML(activeReport, documentData, sections, false),
    [activeReport, documentData, sections]
  );

  return (
    <div className="w-full h-full bg-slate-200">
      <iframe
        srcDoc={htmlContent}
        title="Report Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};
