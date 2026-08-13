import React from 'react';
import { 
  Eye, 
  Download, 
  MessageSquare, 
  Upload, 
  Trash2, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lock,
  GitFork,
  CornerDownRight,
  File
} from 'lucide-react';
import { IIRRequestItem, IIRFile } from '../types';

interface DistributorVerticalViewProps {
  requests: IIRRequestItem[];
  filteredRequests: IIRRequestItem[];
  categoryNames: { num: number; name: string }[];
  isItemComplete: (item: IIRRequestItem) => boolean;
  isLocked: boolean;
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  handleTextResponseChange: (id: string, text: string) => void;
  handleExplanationChange: (id: string, text: string) => void;
  handleFileUpload: (id: string, files: FileList | null) => void;
  handleDeleteFile: (itemId: string, fileId: string) => void;
  setSelectedFileForPreview: (file: IIRFile | null) => void;
  setSelectedItemForComments: (item: IIRRequestItem | null) => void;
  onOpenReferenceModal?: (item: IIRRequestItem) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  handleSubQuestionTextChange?: (itemId: string, subQuestionId: string, val: string) => void;
  handleSubQuestionOptionChange?: (itemId: string, subQuestionId: string, option: string) => void;
  handleSubQuestionFileUpload?: (itemId: string, subQuestionId: string, fileList: FileList | null) => void;
  handleSubQuestionFileDelete?: (itemId: string, subQuestionId: string, fileId: string) => void;
}

export const DistributorVerticalView: React.FC<DistributorVerticalViewProps> = ({
  requests,
  filteredRequests,
  categoryNames,
  isItemComplete,
  isLocked,
  searchQuery,
  statusFilter,
  categoryFilter,
  handleTextResponseChange,
  handleExplanationChange,
  handleFileUpload,
  handleDeleteFile,
  setSelectedFileForPreview,
  setSelectedItemForComments,
  onOpenReferenceModal,
  showToast,
  handleSubQuestionTextChange,
  handleSubQuestionOptionChange,
  handleSubQuestionFileUpload,
  handleSubQuestionFileDelete
}) => {
  const handleDownloadUploadedFile = (file: any) => {
    if (!file) return;
    const targetFileId = file.id || file.evidenceId || file.googleDriveFileId;
    const downloadUrl = `/api/storage/download/${encodeURIComponent(targetFileId)}`;
    showToast(`Downloading "${file.fileName}"...`, 'success');
    const link = document.createElement('a');
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {categoryNames.map(cat => {
        const catRequests = filteredRequests.filter(r => r.categoryNumber === cat.num);
        if (catRequests.length === 0 && (searchQuery || statusFilter !== 'All' || categoryFilter !== 'All')) {
          return null; // Skip empty categories during search filtering
        }

        const totalCatItems = requests.filter(r => r.categoryNumber === cat.num).length;
        const completedCatItems = requests.filter(r => r.categoryNumber === cat.num && isItemComplete(r)).length;
        const catPercent = Math.round((completedCatItems / (totalCatItems || 1)) * 100);

        return (
          <div 
            key={cat.num}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all"
          >
            {/* Category Section Header Banner - Matches Reference Style */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {/* Green Solid Circle with Section Number */}
                <div className="w-7 h-7 rounded-full bg-[#008736] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs select-none">
                  {cat.num}
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {cat.name}
                  </h3>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                    {totalCatItems} requested items &middot; {completedCatItems} completed
                  </span>
                </div>
              </div>

              {/* Progress Bar & Green Percentage Indicator */}
              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                <div className="w-36 sm:w-52 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#008736] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${catPercent}%` }}
                  />
                </div>
                <span className="text-[#008736] font-bold text-xs sm:text-sm font-mono min-w-[36px]">
                  {catPercent}%
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/60">
                    <th className="py-3 px-4 w-[110px] font-medium">Ref no</th>
                    <th className="py-3 px-4 w-[190px] font-medium">Item</th>
                    <th className="py-3 px-4 min-w-[240px] font-medium">Questionnaire</th>
                    <th className="py-3 px-4 min-w-[280px] w-[320px] font-medium">Response</th>
                    <th className="py-3 px-4 min-w-[220px] font-medium">Supporting document</th>
                    <th className="py-3 px-4 w-[120px] text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {catRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No items found matching your current filter in this category.
                      </td>
                    </tr>
                  ) : (
                    catRequests.map(item => {
                      const itemComplete = isItemComplete(item);
                      const hasUploadedFiles = item.uploadedFiles.length > 0 || Object.values(item.subQuestionResponses || {}).some((r: any) => r.uploadedFiles && r.uploadedFiles.length > 0);
                      const requiresMainDocument = item.isMandatory && 
                        item.allowDocumentUpload !== false && 
                        !item.isYesNoOnly && 
                        item.responseType !== 'Yes/No Only' && 
                        item.questionType !== 'yes_no_only' && 
                        item.questionType !== 'yes_no_conditional' && 
                        item.responseType !== 'Yes/No Conditional';

                      const isMandatoryNoDoc = requiresMainDocument && !hasUploadedFiles;
                      const hasValidExplanation = item.noUploadExplanation.trim().length >= 50;
                      const isValidationError = isMandatoryNoDoc && !hasValidExplanation;
                      const isConditional = item.questionType === 'yes_no_conditional' || item.responseType === 'Yes/No Conditional';
                      const showSubQuestions = isConditional && (item.textResponse === 'Yes' || item.textResponse === 'No');

                      return (
                        <React.Fragment key={item.id}>
                        <tr 
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors align-top"
                        >
                          {/* Ref no Column */}
                          <td className="py-4 px-4 font-sans">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {item.refNumber}
                            </div>
                            {item.isMandatory ? (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDE8E8] text-[#9B1C1C] dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/60">
                                Mandatory
                              </span>
                            ) : (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Optional
                              </span>
                            )}
                          </td>

                          {/* Item Column */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                              {item.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(item.isYesNoOnly || item.responseType === 'Yes/No Only') && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/80">
                                  Yes / No Only
                                </span>
                              )}
                              {itemComplete && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DEF7EC] text-[#03543F] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60">
                                  Completed
                                </span>
                              )}
                              {item.reviewerStatus === 'Accepted' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DEF7EC] text-[#03543F] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60">
                                  Accepted
                                </span>
                              )}
                              {item.reviewerStatus === 'Clarification Required' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/60">
                                  Clarification
                                </span>
                              )}
                              {item.reviewerStatus === 'Rejected' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDE8E8] text-[#9B1C1C] dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/60">
                                  Rejected
                                </span>
                              )}
                              {!itemComplete && item.reviewerStatus === 'Pending Review' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Questionnaire Column */}
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>{item.description}</p>
                            
                            {/* Auditor Provided Sample / Reference Material Button */}
                            {item.sampleMaterialEnabled && item.referenceMaterial && item.referenceMaterial.displayToDistributor && (
                              <div className="mt-2.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenReferenceModal && onOpenReferenceModal(item)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/90 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 transition-all shadow-2xs cursor-pointer hover:border-indigo-400"
                                  title="View auditor-provided reference material"
                                >
                                  <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span>ⓘ View Sample</span>
                                  <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded text-indigo-800 dark:text-indigo-200 font-normal">
                                    {item.referenceMaterial.referenceType}
                                  </span>
                                </button>
                              </div>
                            )}

                            {item.reviewerComment && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300">
                                <strong>Reviewer note:</strong> {item.reviewerComment}
                              </div>
                            )}
                          </td>

                          {/* Response Column */}
                          <td className="py-4 px-4 min-w-[320px]">
                            {item.questionType === 'yes_no_conditional' || item.responseType === 'Yes/No Conditional' ? (
                              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Main Requirement Decision:</span>
                                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                                    <GitFork className="h-3 w-3 text-indigo-500" />
                                    Conditional Question
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => {
                                      const nextVal = item.textResponse === 'Yes' ? '' : 'Yes';
                                      handleTextResponseChange(item.id, nextVal);
                                      if (nextVal === 'Yes') {
                                        showToast(`Answered 'YES' for ${item.refNumber}. Please complete triggered sub-questions below.`, 'success');
                                      } else {
                                        showToast(`Selection cleared for ${item.refNumber}. Sub-questions hidden (data preserved).`, 'info');
                                      }
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'Yes'
                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>YES</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => {
                                      const nextVal = item.textResponse === 'No' ? '' : 'No';
                                      handleTextResponseChange(item.id, nextVal);
                                      if (nextVal === 'No') {
                                        showToast(`Answered 'NO' for ${item.refNumber}. Please complete triggered sub-questions below.`, 'info');
                                      } else {
                                        showToast(`Selection cleared for ${item.refNumber}. Sub-questions hidden (data preserved).`, 'info');
                                      }
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'No'
                                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>NO</span>
                                  </button>
                                </div>

                                {!item.textResponse ? (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center pt-1 border-t border-slate-200 dark:border-slate-800">
                                    Select YES or NO above to reveal sub-questions required.
                                  </p>
                                ) : (
                                  <p className="text-[11px] font-semibold text-center pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5">
                                    <span className={item.textResponse === 'Yes' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                                      {item.textResponse}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Branch Active &mdash; see full-width sub-questions below ↓</span>
                                  </p>
                                )}
                              </div>
                            ) : item.isYesNoOnly || item.responseType === 'Yes/No Only' ? (
                              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span>Select Answer:</span>
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                    Yes / No Only
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => {
                                      handleTextResponseChange(item.id, 'Yes');
                                      showToast(`Answered 'Yes' for requirement ${item.refNumber}`, 'success');
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'Yes'
                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Yes</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => {
                                      handleTextResponseChange(item.id, 'No');
                                      showToast(`Answered 'No' for requirement ${item.refNumber}`, 'info');
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'No'
                                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>No</span>
                                  </button>
                                </div>
                                {item.textResponse && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 text-center font-medium">
                                    Selection: <strong className={item.textResponse === 'Yes' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{item.textResponse}</strong>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  value={item.textResponse}
                                  onChange={(e) => handleTextResponseChange(item.id, e.target.value)}
                                  disabled={isLocked}
                                  placeholder="Enter written response / remarks..."
                                  rows={4}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-y min-h-[115px] shadow-2xs"
                                />
                                {isMandatoryNoDoc && (
                                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-red-500 font-medium">No-upload justification:</span>
                                      <span className={hasValidExplanation ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                        {item.noUploadExplanation.length}/50
                                      </span>
                                    </div>
                                    <textarea
                                      value={item.noUploadExplanation}
                                      onChange={(e) => handleExplanationChange(item.id, e.target.value)}
                                      disabled={isLocked}
                                      placeholder="Reason document is unavailable (min 50 chars)..."
                                      rows={2}
                                      className="w-full mt-1 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 placeholder-red-300 focus:outline-none focus:border-red-500"
                                    />
                                    {isValidationError && (
                                      <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3 inline shrink-0" />
                                        <span>Min 50 chars required</span>
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Supporting document Column */}
                          <td className="py-4 px-4">
                            {item.isYesNoOnly || item.responseType === 'Yes/No Only' ? (
                              <div className="p-3 bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1 select-none">
                                <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                  <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span>Uploads Inaccessible</span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                                  This requirement is configured as a Yes/No question. Document attachments and file uploads are disabled for distributors.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {item.uploadedFiles.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {item.uploadedFiles.map(file => (
                                      <div key={file.id} className="flex items-start gap-2 group">
                                        <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                          <button 
                                            onClick={() => setSelectedFileForPreview(file)}
                                            className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block max-w-[200px]"
                                            title={file.fileName}
                                          >
                                            {file.fileName}
                                          </button>
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                                            {file.fileSizeMB} MB &middot; v{file.version}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {!isLocked && (
                                      <label className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer pt-1 font-medium">
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          onChange={(e) => handleFileUpload(item.id, e.target.files)}
                                        />
                                        <Upload className="h-3 w-3" />
                                        <span>+ Add another file</span>
                                      </label>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {!isLocked ? (
                                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          onChange={(e) => handleFileUpload(item.id, e.target.files)}
                                        />
                                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                                        <span>Upload Document</span>
                                      </label>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">No document uploaded</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* View / Actions Column */}
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {item.uploadedFiles.length > 0 && (
                                <>
                                  <button
                                    onClick={() => setSelectedFileForPreview(item.uploadedFiles[0])}
                                    title="View / Preview file & SHA-256 hash"
                                    className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadUploadedFile(item.uploadedFiles[0])}
                                    title="Download File"
                                    className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              
                              {/* Comments / Message button with badge */}
                              <button
                                onClick={() => setSelectedItemForComments(item)}
                                title="Discussion & Clarification Comments"
                                className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer"
                              >
                                <MessageSquare className="h-4 w-4" />
                                {item.comments.length > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {item.comments.length}
                                  </span>
                                )}
                              </button>

                              {/* Trash file if unlocked */}
                              {!isLocked && item.uploadedFiles.length > 0 && (
                                <button
                                  onClick={() => handleDeleteFile(item.id, item.uploadedFiles[0].id)}
                                  title="Remove file"
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>

                        {/* Full-width Sub-questions Section across all 6 columns */}
                        {showSubQuestions && (
                          <tr className="bg-slate-50/90 dark:bg-slate-950/95 border-b-2 border-indigo-500/30 transition-all">
                            <td colSpan={6} className="p-4 sm:p-5">
                              <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 space-y-4 shadow-md animate-fade-in">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                  <div className="flex items-center gap-2">
                                    <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0" />
                                    <span className={`text-sm font-extrabold ${item.textResponse === 'Yes' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      {item.textResponse === 'Yes' ? 'YES Branch Triggered Sub-Questions:' : 'NO Branch Triggered Sub-Questions:'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                      {(item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions?.length : item.conditionalRules?.noSubQuestions?.length) || 0} Sub-questions Required
                                    </span>
                                  </div>
                                </div>

                                {((item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions : item.conditionalRules?.noSubQuestions) || []).length === 0 ? (
                                  <p className="text-xs text-slate-400 italic text-center py-4">
                                    No sub-questions configured for this condition branch.
                                  </p>
                                ) : (
                                  <div className="space-y-4">
                                    {((item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions : item.conditionalRules?.noSubQuestions) || []).map((subQ) => {
                                      const subResp = item.subQuestionResponses?.[subQ.id] || { subQuestionId: subQ.id };
                                      const subFiles = subResp.uploadedFiles || [];

                                      return (
                                        <div key={subQ.id} className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono border border-indigo-200 dark:border-indigo-800">
                                                  Ref {subQ.refCode}
                                                </span>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{subQ.title}</h5>
                                                {subQ.isMandatory ? (
                                                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                                    Required
                                                  </span>
                                                ) : (
                                                  <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                    Optional
                                                  </span>
                                                )}
                                              </div>
                                              {subQ.description && (
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-0.5">
                                                  {subQ.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Subquestion response controls */}
                                          {(subQ.responseFormat === 'text' || subQ.responseFormat === 'number') && (
                                            <input
                                              type={subQ.responseFormat === 'number' ? 'number' : 'text'}
                                              disabled={isLocked}
                                              value={subResp.textResponse || ''}
                                              onChange={(e) => handleSubQuestionTextChange && handleSubQuestionTextChange(item.id, subQ.id, e.target.value)}
                                              placeholder={subQ.responseFormat === 'number' ? 'Enter numeric value...' : 'Enter response or details...'}
                                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                            />
                                          )}

                                          {subQ.responseFormat === 'dropdown' && (
                                            <select
                                              disabled={isLocked}
                                              value={subResp.selectedOption || ''}
                                              onChange={(e) => handleSubQuestionOptionChange && handleSubQuestionOptionChange(item.id, subQ.id, e.target.value)}
                                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                            >
                                              <option value="">-- Select Option --</option>
                                              {(subQ.options || []).map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          )}

                                          {subQ.responseFormat === 'yes_no' && (
                                            <div className="grid grid-cols-2 gap-3 max-w-xs">
                                              <button
                                                type="button"
                                                disabled={isLocked}
                                                onClick={() => handleSubQuestionTextChange && handleSubQuestionTextChange(item.id, subQ.id, 'Yes')}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                  subResp.textResponse === 'Yes'
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                              >
                                                Yes
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isLocked}
                                                onClick={() => handleSubQuestionTextChange && handleSubQuestionTextChange(item.id, subQ.id, 'No')}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                  subResp.textResponse === 'No'
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                              >
                                                No
                                              </button>
                                            </div>
                                          )}

                                          {(subQ.responseFormat === 'file' || subQ.responseFormat === 'text_and_file') && (
                                            <div className="space-y-3">
                                              {subQ.responseFormat === 'text_and_file' && (
                                                <textarea
                                                  disabled={isLocked}
                                                  value={subResp.textResponse || ''}
                                                  onChange={(e) => handleSubQuestionTextChange && handleSubQuestionTextChange(item.id, subQ.id, e.target.value)}
                                                  placeholder="Type explanation or narrative context..."
                                                  rows={2}
                                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                                />
                                              )}

                                              {!isLocked && (
                                                <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl p-3 text-center block cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                                                  <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => handleSubQuestionFileUpload && handleSubQuestionFileUpload(item.id, subQ.id, e.target.files)}
                                                  />
                                                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                                                    <Upload className="h-4 w-4" />
                                                    <span>Upload Sub-question Document</span>
                                                  </div>
                                                </label>
                                              )}

                                              {subFiles.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                  {subFiles.map(file => (
                                                    <div key={file.id} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs shadow-xs">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <File className="h-4 w-4 text-indigo-500 shrink-0" />
                                                        <span className="font-semibold truncate text-slate-900 dark:text-slate-100">{file.fileName}</span>
                                                        <span className="text-[10px] text-slate-500">({file.fileSizeMB} MB)</span>
                                                      </div>
                                                      <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                          type="button"
                                                          onClick={() => setSelectedFileForPreview(file)}
                                                          title="View File"
                                                          className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                        >
                                                          <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleDownloadUploadedFile(file)}
                                                          title="Download File"
                                                          className="p-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                        >
                                                          <Download className="h-3.5 w-3.5" />
                                                        </button>
                                                        {!isLocked && (
                                                          <button
                                                            type="button"
                                                            onClick={() => handleSubQuestionFileDelete && handleSubQuestionFileDelete(item.id, subQ.id, file.id)}
                                                            title="Remove File"
                                                            className="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                          >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
