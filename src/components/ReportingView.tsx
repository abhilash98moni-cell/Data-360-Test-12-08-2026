import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  ChevronRight,
  FileDown,
  CheckCircle,
  ArrowLeft,
  Save,
  Lock,
  Download,
  Bold,
  Italic,
  Underline,
  Strikethrough as StrikethroughIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Table as TableIcon,
  Link as LinkIcon,
  Eraser,
  Type,
  Eye,
  Trash2,
  Maximize,
  Minimize,
} from "lucide-react";
import { UserSession } from "./AuthModal";

import { ReportMetadata } from "../types";
import { ReportPreview, generateReportHTML } from "./ReportPreview";

import { getDistributorsForClient } from "../data/clientsAndDistributors";

interface ReportingViewProps {
  currentUser: UserSession | null;
  selectedClient: string;
  selectedDistributor: string;
}

const generateDistributorOverviewHTML = (
  overview: any,
  distributor: string,
) => {
  return `
    <h1>Distributor Overview</h1>
    <table style="width:100%;">
      <tbody>
        <tr><th style="width:30%;">Distributor Name</th><td>${distributor}</td></tr>
        <tr><th>Location</th><td>${overview?.location || ""}</td></tr>
        <tr><th>Number of Employees</th><td>${overview?.employees || ""}</td></tr>
        <tr><th>Current Contract(s)</th><td>${overview?.contracts || ""}</td></tr>
        <tr><th>Key Contact(s)</th><td>${overview?.contacts || ""}</td></tr>
        <tr><th>Products Sold</th><td>${overview?.products || ""}</td></tr>
        <tr><th>Sales</th><td>${overview?.sales || ""}</td></tr>
        <tr><th>Services Performed</th><td>${overview?.services || ""}</td></tr>
        <tr><th>Sales Territories</th><td>${overview?.territories || ""}</td></tr>
        <tr><th>Gross Margin</th><td>${overview?.grossMargin || ""}</td></tr>
      </tbody>
    </table>
    <p><br></p>
  `;
};

const generateDetailedFindingsHTML = (findings: any[]) => {
  if (!findings || findings.length === 0)
    return `<h1>Detailed Findings & Recommendations</h1><p>No findings recorded.</p>`;

  let html = `<h1>Detailed Findings & Recommendations</h1>`;
  findings.forEach((f) => {
    html += `
      <h2>Finding ${f.findingNumber}: ${f.title || "Untitled"}</h2>
      <p><strong>Contract Reference:</strong> ${f.contractSection || "N/A"}</p>
      <p><strong>Description:</strong></p>
      <p>${f.description || ""}</p>
      <p><strong>Recommended Actions:</strong></p>
      <p>${f.recommendedActionClient || ""}</p>
      <p><strong>Owner(s):</strong> ${f.owner || ""}</p>
      <p><strong>Due Date:</strong> ${f.dueDate || ""}</p>
      <hr />
    `;
  });
  return html;
};

const generateSummaryOfFindingsHTML = (findings: any[]) => {
  if (!findings || findings.length === 0)
    return `<h1>Summary of Findings</h1><p>No findings recorded.</p>`;

  const significant = findings.filter((f) =>
    ["Critical", "High", "Significant"].includes(f.severity),
  );
  const other = findings.filter(
    (f) => !["Critical", "High", "Significant"].includes(f.severity),
  );

  let html = `<h1>Summary of Findings</h1>`;
  html += `<h3>Significant Findings</h3>`;
  if (significant.length > 0) {
    html +=
      `<ul>` +
      significant
        .map(
          (f) =>
            `<li><strong>Finding ${f.findingNumber}:</strong> ${f.title}</li>`,
        )
        .join("") +
      `</ul>`;
  } else {
    html += `<p>No significant findings.</p>`;
  }

  html += `<h3>Other Findings</h3>`;
  if (other.length > 0) {
    html +=
      `<ul>` +
      other
        .map(
          (f) =>
            `<li><strong>Finding ${f.findingNumber}:</strong> ${f.title}</li>`,
        )
        .join("") +
      `</ul>`;
  } else {
    html += `<p>No other findings.</p>`;
  }
  return html;
};

const SectionEditor = ({
  id,
  content,
  onChange,
  readOnly,
}: {
  key?: string | number;
  id: string;
  content: string;
  onChange: (id: string, val: string) => void;
  readOnly: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div className="mb-12 bg-white border border-slate-200 p-10 md:p-14 page-break-inside-avoid">
      <div
        ref={ref}
        contentEditable={!readOnly}
        onInput={() => ref.current && onChange(id, ref.current.innerHTML)}
        onBlur={() => ref.current && onChange(id, ref.current.innerHTML)}
        className="editor-content outline-none text-slate-800 min-h-[3rem]"
      />
    </div>
  );
};

// --- Sub-component for Document Editing ---
const DocumentEditor = ({
  documentData,
  sections,
  onChangeSection,
  readOnly,
}: {
  documentData: Record<string, string>;
  sections: { key?: string | number;
  id: string; label: string }[];
  onChangeSection: (id: string, val: string) => void;
  readOnly: boolean;
}) => {
  const execCommand = (
    command: string,
    value: string | undefined = undefined,
  ) => {
    document.execCommand(command, false, value);
    
    // Trigger input event to update React state
    const activeEl = document.activeElement;
    if (activeEl && activeEl.hasAttribute('contenteditable')) {
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (!size) return;

    document.execCommand("fontSize", false, "7");
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const container = selection.getRangeAt(0).commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container as HTMLElement;
      if (element) {
        const fonts = element.querySelectorAll ? element.querySelectorAll('font[size="7"]') : [];
        fonts.forEach((font) => {
          font.removeAttribute("size");
          (font as HTMLElement).style.fontSize = size + "px";
        });
        if (element.tagName === 'FONT' && element.getAttribute('size') === '7') {
           element.removeAttribute("size");
           element.style.fontSize = size + "px";
        }
      }
    }
    
    const activeEl = document.activeElement;
    if (activeEl && activeEl.hasAttribute('contenteditable')) {
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleHighlight = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.execCommand("backColor", false, e.target.value);
    document.execCommand("hiliteColor", false, e.target.value);
    const activeEl = document.activeElement;
    if (activeEl && activeEl.hasAttribute('contenteditable')) {
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleLineSpacing = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const spacing = e.target.value;
    if (!spacing) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (["p", "div", "h1", "h2", "h3", "li"].includes(tag)) {
            el.style.lineHeight = spacing;
            break;
          }
        }
        if (node.parentNode) {
          node = node.parentNode;
        } else {
          break;
        }
      }
    }
    const activeEl = document.activeElement;
    if (activeEl && activeEl.hasAttribute('contenteditable')) {
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const insertLink = () => {
    const url = prompt("Enter link URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="width:100%;">
        <tbody>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
      </table><p><br></p>
    `;
    execCommand("insertHTML", tableHTML);
  };

  return (
    <div className="flex flex-col h-full bg-slate-200">
      <style>{`
        .editor-content table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
        .editor-content th, .editor-content td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        .editor-content th { background-color: #f1f5f9; font-weight: bold; }
        .editor-content h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; border-bottom: 2px solid #0f172a; padding-bottom: 0.5rem; }
        .editor-content h2 { font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; }
        .editor-content h3 { font-size: 1.125rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.75rem; }
        .editor-content p { margin-bottom: 1rem; line-height: 1.6; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content hr { margin: 2rem 0; border: 0; border-top: 1px solid #e2e8f0; }
        .editor-content:focus { outline: none; }
      `}</style>


      <div className="flex-1 overflow-auto py-12 pb-40 custom-scrollbar relative bg-slate-50">
        <div className="max-w-6xl mx-auto px-8 w-full transition-all duration-300">
          {sections.map((sec, i) => (
            <SectionEditor
              key={sec.id}
              id={sec.id}
              
              content={documentData[sec.id] || ""}
              onChange={onChangeSection}
              readOnly={readOnly}
              
            />
          ))}
                </div>
      </div>
      {!readOnly && (
        <div
          className="flex flex-wrap items-center gap-1.5 p-4 bg-white border-t border-slate-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 text-slate-700 shrink-0 justify-center w-full"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'INPUT') {
              e.preventDefault();
            }
          }}
        >
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => execCommand("undo")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Undo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={() => execCommand("redo")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Redo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Font & Size */}
          <div className="flex items-center gap-1">
            <select
              onChange={(e) => execCommand("fontName", e.target.value)}
              defaultValue=""
              className="bg-transparent border border-slate-300 rounded p-1 text-sm outline-none cursor-pointer w-32"
              title="Font Family"
            >
              <option value="" disabled>
                Font
              </option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
            <select
              onChange={handleFontSize}
              defaultValue=""
              className="bg-transparent border border-slate-300 rounded p-1 text-sm outline-none cursor-pointer w-16"
              title="Font Size"
            >
              <option value="" disabled>
                Size
              </option>
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Character Formatting */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => execCommand("bold")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => execCommand("italic")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => execCommand("underline")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Underline"
            >
              <Underline size={16} />
            </button>
            <button
              onClick={() => execCommand("strikeThrough")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Strikethrough"
            >
              <StrikethroughIcon size={16} />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 ml-1">
            <div className="relative flex items-center" title="Text Color">
              <span className="absolute left-1 pointervents-none text-slate-600">
                <Type size={14} />
              </span>
              <input
                type="color"
                onChange={(e) => execCommand("foreColor", e.target.value)}
                className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer pl-4"
                defaultValue="#000000"
              />
            </div>
            <div className="relative flex items-center" title="Highlight Color">
              <span className="absolute left-1 pointervents-none text-slate-600">
                <Eraser size={14} />
              </span>
              <input
                type="color"
                onChange={handleHighlight}
                className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer pl-4"
                defaultValue="#ffffff"
              />
            </div>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Paragraph Formatting */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => execCommand("justifyLeft")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyCenter")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyRight")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyFull")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Justify"
            >
              <AlignJustify size={16} />
            </button>
          </div>

          {/* Spacing & Indents */}
          <div className="flex items-center gap-1 ml-1">
            <select
              onChange={handleLineSpacing}
              defaultValue=""
              className="bg-transparent border border-slate-300 rounded p-1 text-sm outline-none cursor-pointer"
              title="Line Spacing"
            >
              <option value="" disabled>
                Spacing
              </option>
              <option value="1.0">1.0</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2.0">2.0</option>
            </select>
            <button
              onClick={() => execCommand("indent")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Increase Indent"
            >
              <IndentIncrease size={16} />
            </button>
            <button
              onClick={() => execCommand("outdent")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Decrease Indent"
            >
              <IndentDecrease size={16} />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => execCommand("insertUnorderedList")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => execCommand("insertOrderedList")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Inserts & Formatting Blocks */}
          <div className="flex items-center gap-1">
            <select
              onChange={(e) => execCommand("formatBlock", e.target.value)}
              defaultValue="P"
              className="bg-transparent border border-slate-300 rounded p-1 text-sm outline-none cursor-pointer w-28"
              title="Text Style"
            >
              <option value="P">Normal Text</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
              <option value="H3">Heading 3</option>
            </select>
            <button
              onClick={insertLink}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Insert Link"
            >
              <LinkIcon size={16} />
            </button>
            <button
              onClick={insertTable}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Insert Table"
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => execCommand("removeFormat")}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              title="Clear Formatting"
            >
              <Eraser size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const REPORT_SECTIONS = [
  { id: "executiveSummary", label: "Executive Summary" },
  { id: "summaryOfFindings", label: "Summary of Findings" },
  { id: "detailedFindings", label: "Detailed Findings & Recommendations" },
  { id: "scopeAndProcedures", label: "Scope & Procedures Performed" },
  { id: "distributorOverview", label: "Distributor Overview" },
  { id: "appendixA", label: "Appendix A — Criteria for Significant Findings" },
  { id: "appendixB", label: "Appendix B — Limitations & Other Information" },
  { id: "appendixC", label: "Appendix C — Distribution List" },
];

export const ReportingView: React.FC<ReportingViewProps> = ({
  currentUser,
  selectedClient,
  selectedDistributor,
}) => {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [activeReport, setActiveReport] = useState<ReportMetadata | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [dbError, setDbError] = useState("");

  // Editor states
  const [documentData, setDocumentData] = useState<Record<string, string>>({});
  const [isPreview, setIsPreview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [newReportAuditId, setNewReportAuditId] = useState("eng-101");
  const [newReportTemplate, setNewReportTemplate] = useState(
    "distributor_audit_report",
  );

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
         distributor: selectedDistributor
      });
      const res = await fetch(`/api/reports?${params.toString()}`, {
         headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
         }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.reports) {
        const formattedReports = data.reports.map((row: any) => ({
          id: row.id,
          reportId: row.report_id,
          clientId: row.client_id,
          auditId: row.audit_id,
          reportType: row.report_type,
          templateId: row.template_id,
          templateVersion: row.template_version,
          reportVersion: row.report_version,
          status: row.status,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          finalizedAt: row.finalized_at,
          finalizedBy: row.finalized_by,
          overview: {
            ...row.overview,
            documentData: row.report_content || row.overview?.documentData || {}
          }
        })) as ReportMetadata[];
        setReports(formattedReports);
      }
    } catch (err: any) {
      console.error("Failed to fetch reports", err);
      setDbError("Database error: " + (err.message || String(err)));
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeReport) {
      if (activeReport.overview?.documentData) {
        setDocumentData(activeReport.overview.documentData);
      } else {
        // Initialize rich text from structured data on first open
        setDocumentData({
          executiveSummary: `<h1>Executive Summary</h1>
<p>Global Compliance Investigations (“GCI”), in conjunction with regional management, identified XX (“XX” or “the Distributor”) for a desktop assessment in FY25. EY conducted this assessment at the direction of GCI. The scope and nature of the procedures were developed by GCI and completed at the direction of GCI utilizing EY resources. Assessment procedures were performed from May XX, 20XX to March XX, 20XX and included testing of judgmentally selected transactions and interviews with the Distributor and XX personnel.</p>`,

          summaryOfFindings: `<h1>Summary of Findings</h1>
<h3>Significant Findings<sup>1</sup></h3>
<ol><li>Lack of contracts, due diligence and prior XX approvals for sub-distributor onboarding.</li></ol>
<h3>Other Findings</h3>
<ol start="2"><li>Lack of adequate supporting documentation for third-party disbursements, Employee Reimbursement and Sales & Other Income are classified as below:</li></ol>
<ul>
<li>Third-party disbursement – USD XX</li>
<li>Employee disbursement and reimbursement – USD XX</li>
<li>Sales and other income - USD XX</li>
</ul>
<ol start="3"><li>Lack of written policies regarding employee expense reimbursement, and payment management.</li></ol>`,

          detailedFindings: `<h1>Detailed Findings and Recommendations</h1>
<ol>
<li>
<p><strong>Finding: <u>Lack of contracts, due diligence and prior XX approvals for sub-distributor onboarding.</u></strong></p>
<p>As per the distributor’s agreement, the contract requires that any sub-distributor be pre-approved by XX, subject to documented due diligence, enter into written contract with the Distributor, and agree in writing to comply with all the terms of the XX offer, with audit and inspection rights. XX did not provide evidence demonstrating that due diligence was conducted at the time of onboarding the sub-distributor and documents evidencing prior approvals from XX were obtained for the onboarding of the sub-distributor. However, the approval process followed, including XX involvement and oversight, has not been formally documented.</p>
<p>Based on discussions with Distributor personnel, there are no contracts with the distributors.</p>
<p><em>Applicable Contract Section reference:</em> Section 3.2</p>
<p>Recommended Actions:</p>
<p><u>XX</u> – Recommunicate</p>
<p>Owner(s) and Due Date: TBD.</p>
<p><u>Distributor</u> – The distributor should</p>
<p>Owner(s) and Due Date: TBD.</p>
<hr />
</li>
</ol>
<ol start="4">
<li>
<p><strong>Finding: <u>Lack of adequate supporting documentation for third-party disbursements, Employee Disbursement & Reimbursement and Sales & Other Income totaling USD XX (USD 5,36,625).</u></strong></p>
<p>Seventeen of the thirty transactions assessed, totaling USD XX,classified as third-party disbursements USD XX, Employee Disbursement & Reimbursement USD XX and Sales & Other Income USD XX lacking adequate supporting documentation. The details of each of the seventeen transactions are included in the table below:</p>
<table style="width:100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;">
<thead><tr><th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">Third Party Name</th><th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">Transaction description</th><th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">Amount</th><th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">Supporting Documentation Not Provided</th></tr></thead>
<tbody><tr><td style="border: 1px solid #cbd5e1; padding: 8px;">ABCD</td><td style="border: 1px solid #cbd5e1; padding: 8px;">Office maintenance expenses</td><td style="border: 1px solid #cbd5e1; padding: 8px;">USD XX</td><td style="border: 1px solid #cbd5e1; padding: 8px;"><ol><li>Contract / Agreement</li><li>Period of work performed</li><li>Approvals</li></ol></td></tr></tbody>
</table>
<p>Based on discussions with Distributor personnel:</p>
<ul><li>Contract / Agreement were not provided because there is no formal framework agreement in place with the supplier.</li></ul>
<p><em>Applicable Contract Section reference:</em> Section: 13.8</p>
<p>Recommended Actions:</p>
<p><u>XX</u> – Communicate key accounting and record-keeping requirements to the distributor.</p>
<ul><li>Owner(s) and Due Date: TBD.</li></ul>
<p><u>Distributor</u> – Adequate supporting documentation and business rationale must be maintained for all transactions involving HCP interaction. Supporting documentation must be maintained for all XX-related transactions (e.g., purchase order; contract; documented approval; invoice; proof of payment; and proof of service).</p>
<ul><li>Owner(s) and Due Date: TBD.</li></ul>
<hr />
</li>
<li>
<p><strong>Finding: <u>Lack of written policies regarding approvals, expenses allowed travel & expenses and payment management</u></strong></p>
<p>Based on discussions with Distributor personnel, XX does not have written policies or procedures regarding approvals, travel & expense and payment management.</p>
<ul><li>As it relates to payment management, the Distributor</li></ul>
<p><em>Applicable Contract Section reference:</em> N/A</p>
<p>Recommended Actions:</p>
<p><u>XX</u> – Consider providing the distributor with guidance on developing policies and procedures for employee reimbursements.</p>
<ul><li>Owner(s) and Due Date: TBD.</li></ul>
<p><u>Distributor</u> – Consider developing detailed policies and procedures for employee reimbursements containing designation wise threshold and the approval matrix.</p>
<ul><li>Owner(s) and Due Date: TBD</li></ul>
<hr />
</li>
</ol>`,

          scopeAndProcedures: `<h1>Scope & Procedures Performed</h1>
<p>The planned scope of the assessment procedures covered July 1, 2024, through June 30, 2025 (“Assessment Period”), unless otherwise noted. The scope of the assessment focused on potential improper payments to HCPs either directly or through third parties. As a result, it excluded quality and other requirements of the distributor agreement that are not directly related to payments to health care providers.</p>
<p>The findings in this report are based on assertions made by individuals and/or contained in documents provided by the distributor and/or internal XX systems; these documents and assertions have not been tested for veracity and accuracy. The procedures that were performed were advisory in nature and do not constitute an audit nor other attest services as defined by the Association of International Certified Professional Accountants (“AICPA”). Further, they do not constitute an audit of the Distributor’s historical financial statements in accordance with generally accepted auditing standards, nor do they constitute an examination of prospective financial statements or an examination or review of a compliance program in accordance with standards established by the AICPA.</p>
<p>This report and any related workplans and documents are intended solely for the information and use of XX and are not intended to be, and should not be, used by other parties.</p>`,

          distributorOverview: `<h1>Distributor Overview</h1>
<table style="width:100%; border-collapse: collapse;">
  <tbody>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Distributor Name</th><td style="padding: 8px; border: 1px solid #cbd5e1;">XX</td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Location</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Number of Employees</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Current XX Contract(s)</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Key XX Contact(s)</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">XX Products Sold to the Distributor</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Sales by XX to the Distributor</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Services Performed for XX</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Sales Territories</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Percent of Business Related to XX</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Gross Margin</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Inventory (as of January 2022 per Channel Connect)</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:40%; text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Accounts Receivable (as of January 2022 per SAP)</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
  </tbody>
</table>
<p><br></p>`,

          appendixA: `<h1>Appendix A: Criteria for Significant Findings</h1>
<p>Significant findings are defined as one or more of the following:</p>
<ol>
<li>Significant violation of law, regulation, or Company policy in any geography, particularly in relation to any government healthcare program;</li>
<li>Lack of cooperation, transparency and/or honesty;</li>
<li>Fraudulent conduct, such as falsification of records;</li>
<li>Significant violation of compliance terms in distributor contract;</li>
<li>Any matter that could cause serious risk or reputational damage to XX or its stakeholders;</li>
<li>Findings that in the judgment of the General Counsel (or designee) or Chief Ethics & Compliance Officer (CECO) constitute serious misconduct;</li>
</ol>`,

          appendixB: `<h1>Appendix B: Limitations and Other Information</h1>
<h3>Limitations</h3>
<ol><li>The Distributor does not maintain separate accounting records for its business with XX. All expenses and disbursements at the time of booking are tagged to specific XX employees. Therefore, since there are no formal segregated books and records, as an alternative, the Distributor provided the expenses that were associated with employees that cater to XX's XX business. This process of segregation could not be verified/confirmed.</li></ol>
<h3>Other Information</h3>
<ol><li>Exchange rate used in this report: </li></ol>`,

          appendixC: `<h1>Appendix C: Distribution List</h1>
<table style="width:100%; border-collapse: collapse;">
  <tbody>
    <tr><th style="width:50%; text-align: left; padding: 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9;">Regional/OU Management</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
    <tr><th style="width:50%; text-align: left; padding: 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9;">Local Management</th><td style="padding: 8px; border: 1px solid #cbd5e1;"></td></tr>
  </tbody>
</table>
<p><br></p>`,
        });
      }
    }
  }, [activeReport, selectedDistributor]);

  const handleUpdateSection = (id: string, html: string) => {
    setDocumentData((prev) => ({
      ...prev,
      [id]: html,
    }));
  };

  const handleCreateDraft = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    let realDistributorId = null;
    try {
      const res = await fetch(`/api/distributors?name=${encodeURIComponent(selectedDistributor)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.distributors && data.distributors.length > 0) {
            realDistributorId = data.distributors[0].id;
        }
      }
    } catch (e) {
      console.warn("Could not fetch real distributor ID", e);
    }

    const actualDistributorId = realDistributorId || selectedDistributor;

    const newId = crypto.randomUUID();
    const newReport: ReportMetadata = {
      id: newId,
      clientId: selectedClient,
      distributorId: selectedDistributor,
      auditId: newReportAuditId,
      reportType: "Distributor Audit Report",
      templateId: newReportTemplate,
      templateVersion: "1.0",
      reportVersion: "0.1",
      status: "DRAFT",
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
      findings: [],
      overview: {
        name: selectedDistributor,
        location: "",
        employees: "",
        contracts: "",
        contacts: "",
        products: "",
        sales: "",
        services: "",
        territories: "",
        percentBusiness: "",
        grossMargin: "",
        inventory: "",
        accountsReceivable: "",
      },
    };

    try {
      const payload = {

          id: newId,
          report_id: `rep-${Date.now()}`,
          client_id: newReport.clientId,
          client_name: newReport.clientId,
          distributor_id: actualDistributorId,
          distributor_name: selectedDistributor,
          audit_id: newReport.auditId,
          report_type: newReport.reportType,
          template_id: newReport.templateId,
          template_version: newReport.templateVersion,
          report_version: newReport.reportVersion,
          status: newReport.status,
          created_by: currentUser.id,
          created_by_email: currentUser.email,
          created_by_name: currentUser.full_name,
          created_at: newReport.createdAt,
          findings: newReport.findings,
          overview: newReport.overview,
          report_content: {}
        
      };
      const res = await fetch('/api/reports', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
         },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReports([newReport, ...reports]);
      setIsCreating(false);
      setActiveReport(newReport);
    } catch (err: any) {
      if (err?.code === "PGRST205" || err?.code === "42P01" || err?.code === "42703") {
        console.warn("Expected Database Setup Error: 'audit_reports' table missing. User needs to run SQL.");
        setDbError("Database Persistence Error: The 'audit_reports' table or columns are missing. You must execute the SQL in src/db/supabase_schema.sql to enable persistence.");
      } else {
        console.error("Failed to create report", err);
        setDbError("Failed to create report: " + (err.message || String(err)));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveReport = async (asFinal = false) => {
    if (!activeReport || !currentUser) return;
    setIsSaving(!asFinal);

    const updatedOverview = {
      ...activeReport.overview,
      documentData: documentData,
      ...(asFinal && { finalizedAt: new Date().toISOString() }),
    };

    const status = asFinal ? "FINAL" : activeReport.status;
    const version = asFinal ? "1.0" : activeReport.reportVersion;

    try {
      const payload = {
          overview: updatedOverview,
          report_content: documentData,
          status: status,
          report_version: version,
          updated_at: new Date().toISOString(),
          ...(asFinal && { 
            finalized_at: new Date().toISOString(),
            finalized_by: currentUser.id 
          })
      };

      const res = await fetch(`/api/reports/${activeReport.id}`, {
         method: 'PUT',
         headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
         },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage(asFinal ? "Report finalized!" : "Draft saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);

      const updatedReport = {
        ...activeReport,
        overview: updatedOverview,
        status,
        reportVersion: version,
        ...(asFinal && { finalizedAt: new Date().toISOString() }),
      };

      setActiveReport(updatedReport);
      setReports((prev) =>
        prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
      );
      return updatedReport;
    } catch (err: any) {
      console.error("Failed to save report", err);
      setDbError("Failed to save report: " + (err.message || String(err)));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizeConfirm = async () => {
    setIsFinalizing(true);
    try {
      await saveReport(true);
      setShowFinalizeModal(false);
      setSuccessMessage("Report finalized successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert("Error finalizing report");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deleteTargetId}`, {
         method: 'DELETE',
         headers: {
            'x-user-email': currentUser?.email || ''
         }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReports(reports.filter((r) => r.id !== deleteTargetId));
      if (activeReport?.id === deleteTargetId) {
        setActiveReport(null);
      }
      setDeleteTargetId(null);
      setSuccessMessage("Report deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error deleting report");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (
    format: "docx" | "pdf",
    report: ReportMetadata | null = activeReport,
  ) => {
    if (!report) return;

    const docData = report.overview?.documentData || documentData;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the report.");
      return;
    }

    const htmlContent = generateReportHTML(report, docData, REPORT_SECTIONS, true);

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!currentUser)
    return <div className="p-10 text-white">Please log in.</div>;

  const isDistributor = currentUser.role.includes("Distributor");

  if (activeReport) {
    const isLocked = activeReport.status === "FINAL";


    // Auditor Document Workspace
    if (isPreview) {
      return (
        <div className="fixed inset-0 z-50 w-full h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
            <button
              onClick={() => {
                setActiveReport(null);
                setIsPreview(false);
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" /> Back to Reports
            </button>
            <h1 className="text-lg font-bold text-white">Report Preview</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload("pdf", activeReport)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-200">
            <ReportPreview 
              documentData={documentData} 
              activeReport={activeReport} 
              sections={REPORT_SECTIONS} 
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden ${isFullScreen ? "fixed inset-0 z-50 w-full h-full" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveReport(null)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                Reporting Workspace
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>{activeReport.distributorId}</span>
                <span>•</span>
                <span>
                  Status:{" "}
                  <strong
                    className={isLocked ? "textmerald-400" : "text-amber-400"}
                  >
                    {activeReport.status === "FINAL" ? "Final" : "Draft"}
                  </strong>
                </span>
                {isSaving && (
                  <span className="text-slate-500 ml-2">Saving...</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {successMessage && (
              <div className="textmerald-400 text-sm mr-2">
                {successMessage}
              </div>
            )}

            {!isLocked && (
              <div className="flex items-center gap-3 mr-2">
                <button
                  onClick={() => saveReport(false)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
                >
                  <Save className="h-4 w-4" />{" "}
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => setShowFinalizeModal(true)}
                  disabled={isFinalizing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> Finalize Report
                </button>
              </div>
            )}

            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
              <div className="w-px h-5 bg-slate-700"></div>
              <button
                onClick={() => setIsPreview(!isPreview)}
                title={
                  isPreview && !isLocked ? "Edit Report" : "Preview Report"
                }
                className={`p-2.5 transition-colors ${isPreview && !isLocked ? "bg-indigo-600 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-slate-700"></div>
              <button
                onClick={() => handleDownload("pdf")}
                title="Download Report"
                className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
              {currentUser?.role !== "Distributor" && !currentUser?.role?.includes("Distributor") && (
                <>
                  <div className="w-px h-5 bg-slate-700"></div>
                  <button
                    onClick={() => setDeleteTargetId(activeReport.id)}
                    title="Delete Report"
                    className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Document Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DocumentEditor
              documentData={documentData}
              sections={REPORT_SECTIONS}
              onChangeSection={handleUpdateSection}
              readOnly={isLocked}
            />
          </div>
        </div>

        {/* Modals */}
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">
                Finalize Report
              </h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to finalize this report?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  disabled={isFinalizing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeConfirm}
                  disabled={isFinalizing}
                  className="px-5 py-2.5 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  {isFinalizing ? "Finalizing..." : "Finalize Report"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTargetId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-slate-900 border border-rose-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Report?
              </h3>
              <p className="text-slate-300 mb-6">
                This will permanently delete this report. The underlying
                audit data, findings, evidence, IRL and Data Request
                data will NOT be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete Report"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Landing Page List
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-200">
      {dbError && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 p-4 rounded-xl flex items-start gap-3">
          <div className="p-1 bg-rose-500/20 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-sm font-medium leading-relaxed">{dbError}</div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage and generate standardized Distributor Audit Reports
          </p>
        </div>
        <div className="flex items-center gap-4">
          {successMessage && !activeReport && (
            <div className="textmerald-400 text-sm font-medium">
              {successMessage}
            </div>
          )}
          {!isDistributor && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" /> Create Report
            </button>
          )}
        </div>
      </div>

      {isCreating && !isDistributor && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h2 className="text-lg font-bold text-white mb-6">
            Create New Report
          </h2>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Client
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300">
                {selectedClient}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Distributor
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300">
                {selectedDistributor}
              </div>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Report Template
              </label>
              <select
                value={newReportTemplate}
                onChange={(e) => setNewReportTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="distributor_audit_report">
                  Distributor Audit Report
                </option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsCreating(false)}
              className="px-5 py-2 hover:bg-slate-800 text-slate-300 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDraft}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
            >
              {isSaving ? "Creating..." : "Create Draft"}
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200"
            />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-950/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">
                Distributor
              </th>
              <th className="px-6 py-4 font-semibold tracking-wider">
                Report Type
              </th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reports.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No reports found.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => {
                    setActiveReport(report);
                    if (currentUser?.role === "Distributor" || currentUser?.role?.includes("Distributor") || report.status === "FINAL") {
                      setIsPreview(true);
                    } else {
                      setIsPreview(false);
                    }
                  }}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    {report.distributorId}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {report.reportType}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${
                        report.status === "FINAL"
                          ? "bg-emerald-500/10 textmerald-400 bordermerald-500/20"
                          : report.status === "IN REVIEW"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {report.status === "FINAL" && (
                        <Lock className="h-3 w-3" />
                      )}
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReport(report);
                          setIsPreview(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Preview Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload("pdf", report);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {currentUser?.role !== "Distributor" && !currentUser?.role?.includes("Distributor") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(report.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="w-px h-4 bg-slate-700 mx-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReport(report);
                          if (currentUser?.role === "Distributor" || currentUser?.role?.includes("Distributor") || report.status === "FINAL") {
                            setIsPreview(true);
                          } else {
                            setIsPreview(false);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                        title="Open Report"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Finalize Report
            </h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to finalize this report?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                disabled={isFinalizing}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeConfirm}
                disabled={isFinalizing}
                className="px-5 py-2.5 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {isFinalizing ? "Finalizing..." : "Finalize Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Delete Report?
            </h3>
            <p className="text-slate-300 mb-6">
              This will permanently delete this report. The underlying
              audit data, findings, evidence, IRL and Data Request data will NOT
              be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingView;
