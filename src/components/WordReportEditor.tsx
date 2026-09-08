import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent as IndentIncrease,
  Outdent as IndentDecrease,
  Undo,
  Redo,
  Table as TableIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Split,
  Save,
  Download,
  Maximize,
  Minimize,
  Search,
  BookOpen,
  Highlighter,
  Type,
  ZoomIn,
  ZoomOut,
  Minus,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";
import { ReportMetadata } from "../types";

export interface ReportSectionItem {
  id: string;
  label: string;
}

export const DEFAULT_REPORT_SECTIONS: ReportSectionItem[] = [
  { id: "reportTitle", label: "Report Title / Confidentiality" },
  { id: "reportDate", label: "Report Date" },
  { id: "executiveSummary", label: "Executive Summary" },
  { id: "summaryOfFindings", label: "Summary of Findings" },
  { id: "significantFindings", label: "Significant Findings" },
  { id: "otherFindings", label: "Other Findings" },
  { id: "detailedFindings", label: "Detailed Findings and Recommendations" },
  { id: "scopeAndProcedures", label: "Scope & Procedures Performed" },
  { id: "distributorOverview", label: "Distributor Overview" },
  { id: "appendixA", label: "Appendix A: Criteria for Significant Findings" },
  { id: "appendixB", label: "Appendix B: Limitations and Other Information" },
  { id: "appendixC", label: "Appendix C: Distribution List" },
];

export const getDefaultSectionContent = (
  sectionId: string,
  distributorName: string = "Distributor",
  overview?: any
): string => {
  switch (sectionId) {
    case "reportTitle":
      return `
        <div style="text-align: center; margin-bottom: 2rem; padding: 1.5rem 0; border-bottom: 2px solid #0f172a;">
          <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 2.5px; color: #64748b; font-weight: bold; margin-bottom: 8px;">Strictly Confidential & Proprietary</p>
          <h1 style="font-size: 26px; font-weight: bold; margin-bottom: 8px; color: #0f172a; line-height: 1.3;">DISTRIBUTOR COMPLIANCE AUDIT REPORT</h1>
          <h2 style="font-size: 18px; font-weight: 600; color: #334155; margin-bottom: 12px;">Operational, Anti-Corruption, and Financial Assessment</h2>
          <p style="font-size: 13px; color: #64748b; line-height: 1.6;">Prepared by Global Compliance Investigations & Audit Services<br/>
          <strong>Audited Entity:</strong> ${distributorName}</p>
        </div>
      `;

    case "reportDate":
      return `
        <h2>Report Date & Audit Metadata</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px;">
          <tbody>
            <tr>
              <th style="width: 32%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Report Issuance Date</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" })}</td>
            </tr>
            <tr>
              <th style="width: 32%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Audit Testing Period</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">July 1, 2024 – June 30, 2025</td>
            </tr>
            <tr>
              <th style="width: 32%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Audit Report Version</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Final Audit Workproduct 1.0</td>
            </tr>
            <tr>
              <th style="width: 32%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Confidentiality Classification</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #b91c1c; font-weight: bold;">Restricted — Audit Committee & Senior Leadership Only</td>
            </tr>
          </tbody>
        </table>
      `;

    case "executiveSummary":
      return `
        <h1>1. Executive Summary</h1>
        <p>Global Compliance Investigations (“GCI”), in coordination with corporate legal counsel and regional management, initiated an in-depth distributor compliance review of <strong>${distributorName}</strong>. The assessment was performed to verify adherence to contract terms, local statutory anti-bribery regulations (including FCPA and equivalent standards), fair competition mandates, and transparent books and records requirements.</p>
        <p>Assessment procedures were conducted through on-site interviews, sampling of financial transaction ledgers, verification of proof-of-service documentation, sub-distributor screening, and review of distributor questionnaire responses.</p>
        <p>Overall, while the distributor demonstrated operational capabilities, several high-priority internal control deficiencies were identified that necessitate immediate corrective and preventive action plans (CAPA), notably regarding sub-dealer due diligence and invoice substantiation.</p>
      `;

    case "summaryOfFindings":
      return `
        <h1>2. Summary of Findings</h1>
        <p>The matrix below provides an executive-level summary of findings identified during the testing phase, categorized by risk severity and priority:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left; width: 6%;">#</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left;">Finding Description</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left; width: 15%;">Severity</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left; width: 18%;">Contract Section</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left; width: 15%;">Remediation Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">1</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Lack of formal due diligence and prior approvals for sub-distributor onboarding</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; color: #dc2626;">Significant</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Section 3.2</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">30 Calendar Days</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">2</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Inadequate third-party disbursement supporting documentation and approvals</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; color: #d97706;">Moderate</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Section 13.8</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">45 Calendar Days</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">3</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Absence of written corporate governance policies for employee expense claims</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; color: #2563eb;">Low</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Governance Standard</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">60 Calendar Days</td>
            </tr>
          </tbody>
        </table>
      `;

    case "significantFindings":
      return `
        <h1>3. Significant Findings</h1>
        <h3>Finding 1: Sub-Distributor Onboarding & Oversight Deficiencies</h3>
        <p><strong>Condition:</strong> Testing revealed that ${distributorName} engaged secondary distributors and local delivery agents without obtaining prior written approval or retaining documented anti-bribery screening records.</p>
        <p><strong>Criteria:</strong> Master Distribution Agreement, Section 3.2, stipulates: <em>"Distributor shall not appoint, sub-contract, or delegate any distribution rights to third-party sub-distributors without prior written consent and satisfactory completion of compliance due diligence."</em></p>
        <p><strong>Risk / Impact:</strong> Unscreened third parties performing market services pose elevated regulatory and FCPA risks, as the actions of intermediary agents may be attributed to the principal organization.</p>
        <p><strong>Root Cause:</strong> Absence of an institutionalized third-party risk management workflow within the distributor’s commercial department.</p>
      `;

    case "otherFindings":
      return `
        <h1>4. Other Findings</h1>
        <h3>Finding 2: Disbursement Backing Documentation Deficiencies</h3>
        <p>A statistical sample of 30 commercial disbursements identified 5 instances where itemized invoices, proof of delivery, or vendor contracts were not retained in the accounting archives.</p>
        <h3>Finding 3: Formalization of Travel & Entertainment Approval Thresholds</h3>
        <p>The distributor currently relies on informal email communications rather than a tiered financial delegation of authority (DOA) matrix for travel and entertainment reimbursement approvals.</p>
      `;

    case "detailedFindings":
      return `
        <h1>5. Detailed Findings and Recommendations</h1>
        <ol>
          <li style="margin-bottom: 1.5rem;">
            <h3>Finding 1: Lack of due diligence and prior approvals for sub-distributor onboarding</h3>
            <p><strong>Contract Reference:</strong> Section 3.2</p>
            <p><strong>Detailed Analysis:</strong> The distributor onboarded 3 sub-distributors across regional territories without formal due diligence background reports. Commercial interactions proceeded without executed anti-corruption covenants.</p>
            <p><strong>Recommended Actions:</strong></p>
            <ul>
              <li><strong>Audited Entity (${distributorName}):</strong> Freeze new sub-dealer onboarding until comprehensive third-party questionnaires, sanctions checks, and compliance agreements are completed.</li>
              <li><strong>Principal Enterprise:</strong> Implement an annual compliance audit clause and conduct mandatory distributor compliance training.</li>
            </ul>
            <p><strong>Remediation Lead & Due Date:</strong> Managing Director, ${distributorName} | Within 30 days of report finalization.</p>
            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #cbd5e1;" />
          </li>
          <li style="margin-bottom: 1.5rem;">
            <h3>Finding 2: Inadequate third-party disbursement supporting documentation</h3>
            <p><strong>Contract Reference:</strong> Section 13.8 (Audit and Books and Records)</p>
            <p><strong>Detailed Analysis:</strong> Vouchers totaling USD 48,200 lacked underlying vendor purchase orders and verified service acceptance receipts.</p>
            <p><strong>Recommended Actions:</strong> Mandate a 3-way matching protocol (Purchase Order, Proof of Performance, Commercial Invoice) prior to bank disbursement authorization.</p>
            <p><strong>Remediation Lead & Due Date:</strong> Chief Financial Officer, ${distributorName} | Within 45 days.</p>
            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #cbd5e1;" />
          </li>
        </ol>
      `;

    case "scopeAndProcedures":
      return `
        <h1>6. Scope & Procedures Performed</h1>
        <p>The assessment scope covered all operational and financial activities pertaining to the distribution of products during the period from July 1, 2024, through June 30, 2025. Specific procedures performed included:</p>
        <ul>
          <li>Reviewing the executed Master Distribution Agreement, amendments, and operational standard operating procedures.</li>
          <li>Conducting structured interviews with key personnel across Sales, Logistics, Finance, and Executive Management.</li>
          <li>Performing transactional testing on high-risk disbursement categories, discounts, rebates, and entertainment expenses.</li>
          <li>Assessing anti-corruption compliance controls, whistleblowing mechanisms, and employee training registers.</li>
          <li>Inspecting warehouse and inventory control documentation.</li>
        </ul>
        <p><em>Professional Standards:</em> The procedures performed were advisory and compliance-oriented in nature and do not constitute an audit of financial statements conducted in accordance with GAAP/GAAS standards.</p>
      `;

    case "distributorOverview":
      return `
        <h1>7. Distributor Overview</h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px;">
          <tbody>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Distributor Legal Name</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.name || distributorName}</td>
            </tr>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Headquarters Address</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.location || "Primary Commercial Plaza, Regional Territory"}</td>
            </tr>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Total Headcount</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.employees || "85 full-time personnel"}</td>
            </tr>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Active Contractual Agreements</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.contracts || "Exclusive Territorial Distribution Agreement"}</td>
            </tr>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Products Distributed</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.products || "Medical devices, diagnostics, and consumer health lines"}</td>
            </tr>
            <tr>
              <th style="width: 35%; text-align: left; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold;">Designated Sales Territories</th>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${overview?.territories || "Northern Commercial Sector and Metropolitan Area"}</td>
            </tr>
          </tbody>
        </table>
      `;

    case "appendixA":
      return `
        <h1>Appendix A: Criteria for Significant Findings</h1>
        <p>In evaluating audit observations, findings are graded into distinct severity classifications based on regulatory gravity and enterprise risk exposure:</p>
        <ul>
          <li><strong>Significant (High / Critical):</strong> Any condition representing a material violation of contract terms, applicable anti-bribery statutes (FCPA / UKBA), potential fraud or falsification of records, undisclosed third-party payments, or deliberate circumvention of internal controls. Requires executive notification and a formal 30-day corrective action plan.</li>
          <li><strong>Moderate (Medium):</strong> Non-systemic documentation gaps, procedural deviations in standard approvals, or delays in contract execution that do not present direct anti-corruption exposure. Remediation expected within 45 days.</li>
          <li><strong>Low (Advisory):</strong> Opportunities to optimize internal documentation hygiene, formalize written checklists, or align with industry best practice guidelines.</li>
        </ul>
      `;

    case "appendixB":
      return `
        <h1>Appendix B: Limitations and Other Information</h1>
        <p>The observations and conclusions articulated in this report are subject to the following inherent limitations:</p>
        <ol>
          <li>Procedures were based upon assertions, transaction listings, and sample documentation provided by ${distributorName} and the principal enterprise. Independent forensic authentication of third-party documents was not performed unless explicitly noted.</li>
          <li>Sampling was performed using risk-weighted judgmental methodologies and does not constitute an examination of 100% of all historical transactional ledgers.</li>
          <li>This report is prepared solely for the internal governance and risk oversight of authorized recipients. No third party may rely upon the findings herein without express written authorization.</li>
        </ol>
      `;

    case "appendixC":
      return `
        <h1>Appendix C: Distribution List</h1>
        <p>This final audit report has been transmitted to the designated authorized personnel:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Name / Title</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Organization & Department</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Transmission Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Global Head of Compliance</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Global Compliance Investigations</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Encrypted Digital Delivery</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Regional Vice President, Commercial</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Commercial Operations</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Encrypted Digital Delivery</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Chief Executive Officer / General Manager</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">${distributorName} Senior Management</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Formal Issuance Transmission</td>
            </tr>
          </tbody>
        </table>
      `;

    default:
      return `
        <h2>${sectionId.replace(/([A-Z])/g, " $1").trim()}</h2>
        <p>Enter section details and findings here...</p>
      `;
  }
};

interface WordReportEditorProps {
  report: ReportMetadata;
  sections: ReportSectionItem[];
  documentData: Record<string, string>;
  onUpdateSections: (newSections: ReportSectionItem[]) => void;
  onUpdateSectionContent: (id: string, html: string) => void;
  onSaveDraft: () => Promise<any>;
  onFinalize: () => void;
  isSaving: boolean;
  isFinalizing: boolean;
  readOnly: boolean;
  onBack: () => void;
  onDownload: (format: "pdf" | "docx") => void;
  onTogglePreview?: () => void;
  isPreview?: boolean;
}

export const WordReportEditor: React.FC<WordReportEditorProps> = ({
  report,
  sections,
  documentData,
  onUpdateSections,
  onUpdateSectionContent,
  onSaveDraft,
  onFinalize,
  isSaving,
  isFinalizing,
  readOnly,
  onBack,
  onDownload,
  onTogglePreview,
  isPreview,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ""
  );
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineSearch, setOutlineSearch] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [newSectionModalOpen, setNewSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showTableTools, setShowTableTools] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Calibri, Arial, sans-serif");
  const [selectedFontSize, setSelectedFontSize] = useState("11pt");

  // Keep references to section DOM nodes for scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Calculate word and character count across all sections
  useEffect(() => {
    let totalText = "";
    Object.values(documentData).forEach((rawHtml) => {
      const htmlStr = typeof rawHtml === "string" ? rawHtml : "";
      if (htmlStr) {
        const text = htmlStr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        totalText += " " + text;
      }
    });
    const trimmed = totalText.trim();
    setCharCount(trimmed.length);
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
  }, [documentData]);

  // Command executor for contentEditable
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    // Find active contentEditable element and fire input event
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== document.body) {
        if (
          (node as HTMLElement).hasAttribute &&
          (node as HTMLElement).hasAttribute("contenteditable")
        ) {
          node.dispatchEvent(new Event("input", { bubbles: true }));
          break;
        }
        node = node.parentNode;
      }
    }
  };

  const handleScrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Section Add / Reorder / Delete handlers
  const handleOpenAddSectionModal = (afterIdx: number | null = null) => {
    setInsertAfterIndex(afterIdx);
    setNewSectionName("");
    setNewSectionModalOpen(true);
  };

  const handleConfirmAddSection = () => {
    if (!newSectionName.trim()) return;
    const newId = "sec_" + Date.now();
    const newSec: ReportSectionItem = {
      id: newId,
      label: newSectionName.trim(),
    };

    let updated: ReportSectionItem[] = [];
    if (insertAfterIndex !== null && insertAfterIndex >= 0) {
      updated = [
        ...sections.slice(0, insertAfterIndex + 1),
        newSec,
        ...sections.slice(insertAfterIndex + 1),
      ];
    } else {
      updated = [...sections, newSec];
    }

    // Initialize content
    const initialContent = `
      <h2>${newSec.label}</h2>
      <p>Enter detailed observations, analysis, and recommendations for this section...</p>
    `;
    onUpdateSectionContent(newId, initialContent);
    onUpdateSections(updated);
    setNewSectionModalOpen(false);
    setActiveSectionId(newId);

    setTimeout(() => {
      handleScrollToSection(newId);
    }, 100);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    onUpdateSections(newSections);
  };

  const handleStartRenameSection = (id: string, currentLabel: string) => {
    setEditingSectionId(id);
    setEditingSectionTitle(currentLabel);
  };

  const handleSaveRenameSection = () => {
    if (!editingSectionId || !editingSectionTitle.trim()) return;
    const updated = sections.map((s) =>
      s.id === editingSectionId ? { ...s, label: editingSectionTitle.trim() } : s
    );
    onUpdateSections(updated);
    setEditingSectionId(null);
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert("A report must contain at least one section.");
      return;
    }
    const updated = sections.filter((s) => s.id !== id);
    onUpdateSections(updated);
    setDeleteConfirmId(null);
    if (activeSectionId === id && updated[0]) {
      setActiveSectionId(updated[0].id);
    }
  };

  // Table Insertion
  const handleInsertTable = () => {
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">`;
    if (tableHasHeader) {
      tableHtml += `<thead><tr>`;
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left; font-weight: bold;">Column ${c}</th>`;
      }
      tableHtml += `</tr></thead>`;
    }
    tableHtml += `<tbody>`;
    for (let r = 1; r <= tableRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Data ${r}-${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    execCmd("insertHTML", tableHtml);
    setTableModalOpen(false);
  };

  // Table manipulation helpers
  const handleAddTableRow = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const tr = (node as HTMLElement)?.closest
      ? (node as HTMLElement).closest("tr")
      : node?.parentElement?.closest("tr");
    if (tr) {
      const colCount = tr.children.length;
      const newTr = document.createElement("tr");
      for (let i = 0; i < colCount; i++) {
        const td = document.createElement("td");
        td.style.border = "1px solid #cbd5e1";
        td.style.padding = "8px 12px";
        td.innerHTML = "&nbsp;";
        newTr.appendChild(td);
      }
      tr.parentNode?.insertBefore(newTr, tr.nextSibling);
      tr.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleDeleteTableRow = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const tr = (node as HTMLElement)?.closest
      ? (node as HTMLElement).closest("tr")
      : node?.parentElement?.closest("tr");
    if (tr && tr.parentNode) {
      const table = tr.closest("table");
      tr.parentNode.removeChild(tr);
      if (table) table.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleAddTableCol = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const td = (node as HTMLElement)?.closest
      ? (node as HTMLElement).closest("td, th")
      : node?.parentElement?.closest("td, th");
    const table = td?.closest("table");
    if (td && table) {
      const cellIndex = (td as HTMLTableCellElement).cellIndex;
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const isHeader = row.parentElement?.tagName === "THEAD" || i === 0;
        const newCell = document.createElement(isHeader ? "th" : "td");
        newCell.style.border = "1px solid #cbd5e1";
        newCell.style.padding = "8px 12px";
        if (isHeader) {
          newCell.style.backgroundColor = "#f1f5f9";
          newCell.style.fontWeight = "bold";
          newCell.innerHTML = "New Column";
        } else {
          newCell.innerHTML = "&nbsp;";
        }
        if (cellIndex < row.children.length - 1) {
          row.insertBefore(newCell, row.children[cellIndex + 1]);
        } else {
          row.appendChild(newCell);
        }
      }
      table.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleDeleteTableCol = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const td = (node as HTMLElement)?.closest
      ? (node as HTMLElement).closest("td, th")
      : node?.parentElement?.closest("td, th");
    const table = td?.closest("table");
    if (td && table) {
      const cellIndex = (td as HTMLTableCellElement).cellIndex;
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (cellIndex < row.children.length) {
          row.removeChild(row.children[cellIndex]);
        }
      }
      table.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleDeleteTable = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const table = (node as HTMLElement)?.closest
      ? (node as HTMLElement).closest("table")
      : node?.parentElement?.closest("table");
    if (table && table.parentNode) {
      table.parentNode.removeChild(table);
    }
  };

  // Insert Page Break
  const handleInsertPageBreak = () => {
    const pageBreakHtml = `
      <div class="word-page-break" style="page-break-after: always; margin: 24px 0; padding: 8px 0; border-top: 2px dashed #94a3b8; text-align: center; color: #64748b; font-size: 11px; font-weight: bold; letter-spacing: 1px; user-select: none;">
        ——— PAGE BREAK ———
      </div>
      <p><br></p>
    `;
    execCmd("insertHTML", pageBreakHtml);
  };

  // Insert Image
  const handleInsertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            execCmd(
              "insertHTML",
              `<div style="text-align: center; margin: 16px 0;"><img src="${dataUrl}" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px;" alt="Audit Evidence Image" /><p style="font-size: 11px; color: #64748b; margin-top: 4px;">Figure: Audit Supporting Documentation</p></div><p><br></p>`
            );
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Insert Link
  const handleInsertLink = () => {
    const url = prompt("Enter hyperlink URL:", "https://");
    if (url && url !== "https://") {
      execCmd("createLink", url);
    }
  };

  const filteredSections = sections.filter((s) =>
    s.label.toLowerCase().includes(outlineSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Top Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Back to Reports list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white max-w-[280px] truncate">
                  {report.distributorId} — {report.reportType}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    report.status === "FINAL"
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                      : "bg-amber-950/60 text-amber-400 border-amber-800"
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Client: <span className="text-slate-300">{report.clientId}</span> • Audit ID:{" "}
                <span className="text-slate-300">{report.auditId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {readOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finalized (Read-Only)</span>
            </div>
          ) : (
            <>
              <button
                onClick={onSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors shadow-sm"
                title="Save report sections and content to Supabase database"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                {isSaving ? "Saving..." : "Save Draft"}
              </button>

              <button
                onClick={onFinalize}
                disabled={isFinalizing}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                title="Finalize report and lock from further edits"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finalize Report
              </button>
            </>
          )}

          <div className="h-5 w-px bg-slate-800 mx-1"></div>

          {onTogglePreview && (
            <button
              onClick={onTogglePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors shadow-sm"
              title="Preview formatted print document"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              Preview
            </button>
          )}

          <button
            onClick={() => onDownload("pdf")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            title="Download / Print formatted audit report"
          >
            <Download className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Word-style Formatting Ribbon Toolbar */}
      {!readOnly && (
        <div
          className="flex flex-wrap items-center gap-1 px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-300 shrink-0 z-20 shadow-sm"
          onMouseDown={(e) => {
            // Prevent blur of active contentEditable when clicking toolbar buttons
            if (
              (e.target as HTMLElement).tagName !== "SELECT" &&
              (e.target as HTMLElement).tagName !== "INPUT"
            ) {
              e.preventDefault();
            }
          }}
        >
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-800">
            <button
              onClick={() => execCmd("undo")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("redo")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Heading / Style Selector */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === "p") execCmd("formatBlock", "<p>");
                else if (val === "h1") execCmd("formatBlock", "<h1>");
                else if (val === "h2") execCmd("formatBlock", "<h2>");
                else if (val === "h3") execCmd("formatBlock", "<h3>");
                else if (val === "h4") execCmd("formatBlock", "<h4>");
                e.target.value = "";
              }}
              defaultValue=""
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
              title="Text Heading / Style"
            >
              <option value="" disabled>
                Heading / Style
              </option>
              <option value="p">Normal Paragraph</option>
              <option value="h1">Heading 1 (Main Title)</option>
              <option value="h2">Heading 2 (Section Title)</option>
              <option value="h3">Heading 3 (Subheading)</option>
              <option value="h4">Heading 4 (Minor Subheading)</option>
            </select>

            {/* Font Family */}
            <select
              value={selectedFont}
              onChange={(e) => {
                setSelectedFont(e.target.value);
                execCmd("fontName", e.target.value);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer max-w-[110px]"
              title="Font Family"
            >
              <option value="Calibri, Arial, sans-serif">Calibri</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', Courier, monospace">Courier New</option>
              <option value="system-ui, sans-serif">Modern Sans</option>
            </select>

            {/* Font Size */}
            <select
              value={selectedFontSize}
              onChange={(e) => {
                const size = e.target.value;
                setSelectedFontSize(size);
                execCmd("fontSize", "7");
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  const container = sel.getRangeAt(0).commonAncestorContainer;
                  const el =
                    container.nodeType === 3
                      ? container.parentElement
                      : (container as HTMLElement);
                  if (el) {
                    const fonts = el.querySelectorAll('font[size="7"]');
                    fonts.forEach((f) => {
                      f.removeAttribute("size");
                      (f as HTMLElement).style.fontSize = size;
                    });
                  }
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer w-[65px]"
              title="Font Size"
            >
              <option value="9pt">9 pt</option>
              <option value="10pt">10 pt</option>
              <option value="11pt">11 pt</option>
              <option value="12pt">12 pt</option>
              <option value="14pt">14 pt</option>
              <option value="16pt">16 pt</option>
              <option value="18pt">18 pt</option>
              <option value="24pt">24 pt</option>
              <option value="30pt">30 pt</option>
            </select>
          </div>

          {/* Bold, Italic, Underline, Strikethrough */}
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
            <button
              onClick={() => execCmd("bold")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white font-bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("italic")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("underline")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("strikeThrough")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colors: Text & Highlight */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <label
              className="flex items-center gap-1 p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-300 hover:text-white text-xs"
              title="Font Text Color"
            >
              <Type className="w-3.5 h-3.5 text-rose-400" />
              <input
                type="color"
                className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                defaultValue="#000000"
                onChange={(e) => execCmd("foreColor", e.target.value)}
              />
            </label>

            <label
              className="flex items-center gap-1 p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-300 hover:text-white text-xs"
              title="Text Highlight Color"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-300" />
              <input
                type="color"
                className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                defaultValue="#fef08a"
                onChange={(e) => {
                  execCmd("hiliteColor", e.target.value);
                  execCmd("backColor", e.target.value);
                }}
              />
            </label>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
            <button
              onClick={() => execCmd("justifyLeft")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("justifyCenter")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("justifyRight")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("justifyFull")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists & Indentation */}
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
            <button
              onClick={() => execCmd("insertUnorderedList")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("insertOrderedList")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("outdent")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Decrease Indent"
            >
              <IndentDecrease className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd("indent")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Increase Indent"
            >
              <IndentIncrease className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line Spacing */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <select
              onChange={(e) => {
                const spacing = e.target.value;
                if (!spacing) return;
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  let node: Node | null = sel.anchorNode;
                  while (node && node !== document.body) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const el = node as HTMLElement;
                      const tag = el.tagName.toLowerCase();
                      if (["p", "div", "h1", "h2", "h3", "h4", "li"].includes(tag)) {
                        el.style.lineHeight = spacing;
                        break;
                      }
                    }
                    node = node.parentNode;
                  }
                }
              }}
              defaultValue="1.5"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none cursor-pointer"
              title="Line Spacing"
            >
              <option value="1.0">1.0 Single</option>
              <option value="1.15">1.15 Spacing</option>
              <option value="1.5">1.5 Spacing</option>
              <option value="2.0">2.0 Double</option>
            </select>
          </div>

          {/* Insert Tools: Table, Page Break, Image, Link */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <button
              onClick={() => setTableModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-200 hover:text-white transition-colors"
              title="Insert Structured Table"
            >
              <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Table</span>
            </button>

            <button
              onClick={handleInsertPageBreak}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-200 hover:text-white transition-colors"
              title="Insert Printable Page Break"
            >
              <Split className="w-3.5 h-3.5 text-emerald-400" />
              <span>Page Break</span>
            </button>

            <button
              onClick={handleInsertImage}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Insert Evidence Image / Screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={handleInsertLink}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Insert Hyperlink"
            >
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
            </button>

            <button
              onClick={() => execCmd("insertHorizontalRule")}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Insert Divider Line"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Cell Manipulation Menu toggle */}
          <button
            onClick={() => setShowTableTools(!showTableTools)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              showTableTools
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Table Tools: Add/Delete Rows and Columns"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table Tools</span>
          </button>

          {/* Add Section Quick Button */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => handleOpenAddSectionModal()}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white rounded text-xs font-medium transition-colors"
              title="Add a custom section anywhere in the audit report"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Table Tools Bar (when opened) */}
      {showTableTools && !readOnly && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950 border-b border-indigo-900/50 text-xs text-slate-300 shrink-0">
          <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
            Table Actions:
          </span>
          <button
            onClick={handleAddTableRow}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 hover:text-white"
          >
            + Add Row Below
          </button>
          <button
            onClick={handleDeleteTableRow}
            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded"
          >
            - Delete Row
          </button>
          <div className="h-4 w-px bg-slate-800"></div>
          <button
            onClick={handleAddTableCol}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 hover:text-white"
          >
            + Add Column
          </button>
          <button
            onClick={handleDeleteTableCol}
            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded"
          >
            - Delete Column
          </button>
          <button
            onClick={handleDeleteTable}
            className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded border border-rose-800"
          >
            Delete Table
          </button>
          <span className="text-slate-500 text-[11px] ml-auto">
            Place cursor inside any table cell and click an action
          </span>
        </div>
      )}

      {/* Main Workspace: Left Outline Sidebar + Center Document Canvas */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Section Navigation Outline Sidebar */}
        <div
          className={`flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 shrink-0 z-10 ${
            outlineOpen ? "w-80" : "w-0 overflow-hidden"
          }`}
        >
          {/* Outline Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Report Outline ({sections.length})</span>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleOpenAddSectionModal()}
                className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Add New Section"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search filter in outline */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter headings..."
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Outline Sections List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredSections.map((sec, idx) => {
              const originalIdx = sections.findIndex((s) => s.id === sec.id);
              const isActive = activeSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-medium"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                  onClick={() => handleScrollToSection(sec.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono w-4">
                      {originalIdx + 1}.
                    </span>
                    <span className="truncate">{sec.label}</span>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(originalIdx, "up");
                        }}
                        disabled={originalIdx === 0}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(originalIdx, "down");
                        }}
                        disabled={originalIdx === sections.length - 1}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRenameSection(sec.id, sec.label);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400"
                        title="Rename Heading"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(sec.id);
                        }}
                        className="p-1 hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-400"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outline Footer Help */}
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/80">
            <span>{sections.length} Sections Defined</span>
            {!readOnly && (
              <button
                onClick={() => handleOpenAddSectionModal()}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Add Custom
              </button>
            )}
          </div>
        </div>

        {/* Outline Toggle Strip */}
        <button
          onClick={() => setOutlineOpen(!outlineOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-12 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center rounded-r transition-colors shadow"
          style={{ left: outlineOpen ? "20rem" : "0" }}
          title={outlineOpen ? "Collapse Outline" : "Expand Outline"}
        >
          {outlineOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Center Paper Canvas Layout */}
        <div className="flex-1 overflow-y-auto bg-slate-300 py-10 px-4 flex justify-center custom-scrollbar">
          {/* Standard Word-like Document Sheet (Letter / A4 Proportion) */}
          <div
            className="w-full max-w-[860px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              minHeight: "1100px",
            }}
          >
            {/* Page Header (Printed Margin Decoration) */}
            <div className="px-12 pt-8 pb-4 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 select-none">
              <span className="font-bold tracking-wider text-slate-700 uppercase">
                DISTRIBUTOR AUDIT REPORT — STRICTLY CONFIDENTIAL
              </span>
              <span>Global Compliance Investigations</span>
            </div>

            {/* Document Content Sections */}
            <div className="p-12 md:p-16 space-y-12">
              <style>{`
                .word-editor-content {
                  outline: none;
                  font-family: Calibri, Arial, sans-serif;
                  font-size: 11pt;
                  line-height: 1.6;
                  color: #1e293b;
                }
                .word-editor-content h1 {
                  font-size: 20pt;
                  font-weight: bold;
                  color: #0f172a;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                  border-bottom: 1.5px solid #0f172a;
                  padding-bottom: 0.35rem;
                }
                .word-editor-content h2 {
                  font-size: 15pt;
                  font-weight: bold;
                  color: #1e293b;
                  margin-top: 1.25rem;
                  margin-bottom: 0.5rem;
                }
                .word-editor-content h3 {
                  font-size: 12.5pt;
                  font-weight: 600;
                  color: #334155;
                  margin-top: 1rem;
                  margin-bottom: 0.4rem;
                }
                .word-editor-content h4 {
                  font-size: 11.5pt;
                  font-weight: 600;
                  color: #475569;
                  margin-top: 0.75rem;
                  margin-bottom: 0.35rem;
                }
                .word-editor-content p {
                  margin-bottom: 0.85rem;
                }
                .word-editor-content ul {
                  list-style-type: disc;
                  padding-left: 1.75rem;
                  margin-bottom: 0.85rem;
                }
                .word-editor-content ol {
                  list-style-type: decimal;
                  padding-left: 1.75rem;
                  margin-bottom: 0.85rem;
                }
                .word-editor-content table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1rem 0;
                  font-size: 10pt;
                }
                .word-editor-content th, .word-editor-content td {
                  border: 1px solid #cbd5e1;
                  padding: 8px 10px;
                  text-align: left;
                }
                .word-editor-content th {
                  background-color: #f8fafc;
                  font-weight: bold;
                  color: #0f172a;
                }
                .word-editor-content hr {
                  border: 0;
                  border-top: 1px solid #e2e8f0;
                  margin: 1.5rem 0;
                }
                .word-editor-content a {
                  color: #2563eb;
                  text-decoration: underline;
                }
                .word-page-break {
                  page-break-after: always;
                }
              `}</style>

              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  ref={(el) => {
                    sectionRefs.current[sec.id] = el;
                  }}
                  className={`group relative rounded-lg transition-all duration-200 ${
                    activeSectionId === sec.id
                      ? "ring-2 ring-indigo-500/40 bg-indigo-50/10 p-2"
                      : "hover:bg-slate-50/50 p-2"
                  }`}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  {/* Section Top Control Header (Auditor Toolbar) */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 select-none">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-bold text-slate-700">
                        Section {idx + 1}
                      </span>
                      {editingSectionId === sec.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRenameSection();
                              if (e.key === "Escape") setEditingSectionId(null);
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs bg-white border border-indigo-500 rounded text-slate-900 font-semibold outline-none"
                          />
                          <button
                            onClick={handleSaveRenameSection}
                            className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            title="Save Title"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingSectionId(null)}
                            className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">
                            {sec.label}
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() =>
                                handleStartRenameSection(sec.id, sec.label)
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-opacity"
                              title="Rename Section Heading"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section Move / Delete / Add Below actions */}
                    {!readOnly && (
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMoveSection(idx, "up")}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] text-slate-600 flex items-center gap-1"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3 h-3" /> Up
                        </button>
                        <button
                          onClick={() => handleMoveSection(idx, "down")}
                          disabled={idx === sections.length - 1}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] text-slate-600 flex items-center gap-1"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3 h-3" /> Down
                        </button>
                        <button
                          onClick={() => handleOpenAddSectionModal(idx)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium flex items-center gap-1"
                          title="Insert a new section immediately below this one"
                        >
                          <Plus className="w-3 h-3" /> Section Below
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sec.id)}
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete this section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section Editable Content */}
                  <SectionContentItem
                    id={sec.id}
                    content={documentData[sec.id] || ""}
                    onChange={onUpdateSectionContent}
                    readOnly={readOnly}
                  />
                </div>
              ))}

              {/* Bottom Quick Section Creator */}
              {!readOnly && (
                <div className="pt-6 border-t-2 border-dashed border-slate-200 text-center select-none">
                  <button
                    onClick={() => handleOpenAddSectionModal(sections.length - 1)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-300 hover:border-indigo-300 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-indigo-500" />
                    <span>+ Add Section at End of Report</span>
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Auditors have full authority to add unlimited sections, appendices, and customized headings.
                  </p>
                </div>
              )}
            </div>

            {/* Document Printed Footer */}
            <div className="px-12 py-6 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between select-none">
              <span>
                Business Confidential; Not for Distribution Without Approval from Global Compliance Investigations
              </span>
              <span>Audit Working Paper</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar (Word-style) */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">{sections.length}</span>
            <span>Sections</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">{wordCount.toLocaleString()}</span>
            <span>Words</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">{charCount.toLocaleString()}</span>
            <span>Characters</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3 h-3" />
            <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
          </div>
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-mono w-10 text-center text-slate-300">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Modal: Add Section */}
      {newSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add New Report Section</span>
              </div>
              <button
                onClick={() => setNewSectionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Auditors can add customized audit sections anywhere. Enter the title or heading name:
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Section Title / Heading
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8. Sub-Distributor Banking Examination"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmAddSection();
                  }}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Quick suggestions:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Inventory Reconciliation",
                    "Government HCP Payments Review",
                    "Off-Book Accounts Analysis",
                    "Warehouse Verification",
                    "Anti-Corruption Training Records",
                    "Remediation Plan (CAPA)",
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewSectionName(sug)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setNewSectionModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddSection}
                disabled={!newSectionName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Insert Custom Table */}
      {tableModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <TableIcon className="w-4 h-4 text-indigo-400" />
                <span>Insert Table</span>
              </div>
              <button
                onClick={() => setTableModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Include styled table header row</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setTableModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertTable}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Section */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Delete Section?
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete this section? Its text and content will be removed from the audit report.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSection(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for individual section contentEditable block
const SectionContentItem: React.FC<{
  id: string;
  content: string;
  onChange: (id: string, val: string) => void;
  readOnly: boolean;
}> = ({ id, content, onChange, readOnly }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    // Only update innerHTML if not actively focused, or if element is empty
    if (document.activeElement !== ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content || "";
    }
  }, [content]);

  // Initial load
  useEffect(() => {
    if (ref.current && !ref.current.innerHTML && content) {
      ref.current.innerHTML = content;
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={() => {
        if (ref.current) {
          isInternalChangeRef.current = true;
          onChange(id, ref.current.innerHTML);
        }
      }}
      onBlur={() => {
        if (ref.current) {
          onChange(id, ref.current.innerHTML);
        }
      }}
      className="word-editor-content min-h-[4rem]"
    />
  );
};
