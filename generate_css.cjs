const fs = require('fs');

const css = `
@import "tailwindcss";

.light-theme {
  color-scheme: light;
  background-color: #f8fafc !important;
  color: #0f172a !important;
}

/* 1. Page Backgrounds (Applied to root elements normally) */
.light-theme.bg-slate-950 {
  background-color: #f8fafc !important;
}

/* 2. Primary Surfaces (Cards, Modals, KPI Cards) */
.light-theme .bg-slate-950,
.light-theme .bg-slate-950\\/90,
.light-theme .bg-slate-950\\/80,
.light-theme .bg-slate-950\\/60,
.light-theme .bg-slate-950\\/40,
.light-theme .bg-slate-950\\/30,
.light-theme .bg-slate-950\\/20,
.light-theme .hover\\:bg-slate-950:hover,
.light-theme .focus\\:bg-slate-950:focus,
.light-theme .bg-slate-900,
.light-theme .bg-slate-900\\/90,
.light-theme .bg-slate-900\\/80,
.light-theme .bg-slate-900\\/60,
.light-theme .bg-slate-900\\/50,
.light-theme .bg-slate-900\\/40,
.light-theme .bg-slate-850,
.light-theme .hover\\:bg-slate-900:hover,
.light-theme .hover\\:bg-slate-900\\/50:hover,
.light-theme .hover\\:bg-slate-900\\/60:hover,
.light-theme .focus\\:bg-slate-900:focus {
  background-color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03) !important;
}

/* 3. Secondary Surfaces (Table Headers, Hover States, Search Bars) */
.light-theme .bg-slate-800,
.light-theme .bg-slate-800\\/80,
.light-theme .bg-slate-800\\/60,
.light-theme .bg-slate-800\\/50,
.light-theme .bg-slate-800\\/40,
.light-theme .bg-slate-800\\/30,
.light-theme .hover\\:bg-slate-800:hover,
.light-theme .hover\\:bg-slate-800\\/80:hover,
.light-theme .hover\\:bg-slate-800\\/50:hover,
.light-theme .hover\\:bg-slate-800\\/40:hover,
.light-theme .hover\\:bg-slate-800\\/30:hover {
  background-color: #f1f5f9 !important;
}

/* Remove box-shadow when hovering elements that shouldn't look like floating cards */
.light-theme button.hover\\:bg-slate-800:hover,
.light-theme tr.hover\\:bg-slate-800:hover,
.light-theme tr.hover\\:bg-slate-800\\/50:hover {
  box-shadow: none !important;
}

.light-theme .bg-slate-700,
.light-theme .bg-slate-750,
.light-theme .hover\\:bg-slate-700:hover {
  background-color: #e2e8f0 !important;
}

/* 4. Borders */
.light-theme .border-slate-800,
.light-theme .border-slate-800\\/80,
.light-theme .border-slate-800\\/50,
.light-theme .border-slate-800\\/40,
.light-theme .border-slate-800\\/30,
.light-theme .border-slate-700,
.light-theme .border-slate-700\\/80,
.light-theme .border-slate-600,
.light-theme .border-slate-900,
.light-theme .border-slate-900\\/30,
.light-theme .border-slate-900\\/50,
.light-theme .divide-slate-800\\/80,
.light-theme .divide-slate-800 > :not([hidden]) ~ :not([hidden]),
.light-theme .border-b-slate-800,
.light-theme .border-t-slate-800,
.light-theme .border-l-slate-800,
.light-theme .border-r-slate-800 {
  border-color: #e2e8f0 !important;
}

.light-theme .hover\\:border-slate-700:hover {
  border-color: #cbd5e1 !important;
}

/* 5. Typography */
.light-theme .text-slate-100,
.light-theme .text-slate-200,
.light-theme .text-white,
.light-theme .hover\\:text-slate-200:hover,
.light-theme .hover\\:text-white:hover {
  color: #0f172a !important;
}

.light-theme .text-slate-300 {
  color: #334155 !important;
}

.light-theme .text-slate-400,
.light-theme .text-slate-400\\/80 {
  color: #475569 !important;
}

.light-theme .text-slate-500 {
  color: #64748b !important;
}

/* Additional text colors */
.light-theme .text-emerald-500 { color: #047857 !important; }
.light-theme .text-indigo-500 { color: #1d4ed8 !important; }
.light-theme .text-amber-500 { color: #b45309 !important; }
.light-theme .text-rose-500 { color: #b91c1c !important; }
.light-theme .text-purple-500 { color: #6b21a8 !important; }

/* Ensure placeholder text is legible */
.light-theme .placeholder\\:text-slate-500::placeholder {
  color: #94a3b8 !important;
}

/* 6. Status Pills & Badges (Emerald / Success) */
.light-theme .bg-emerald-500\\/10,
.light-theme .bg-emerald-500\\/20,
.light-theme .bg-emerald-500\\/30,
.light-theme .bg-emerald-600\\/20,
.light-theme .bg-emerald-950\\/20,
.light-theme .bg-emerald-950\\/40,
.light-theme .bg-emerald-950\\/50,
.light-theme .bg-emerald-950\\/60,
.light-theme .bg-emerald-950\\/80,
.light-theme .bg-emerald-900\\/30,
.light-theme .hover\\:bg-emerald-600\\/30:hover,
.light-theme .hover\\:bg-emerald-600\\/40:hover {
  background-color: #d1fae5 !important; /* emerald-100 */
}

.light-theme .text-emerald-200,
.light-theme .text-emerald-300,
.light-theme .text-emerald-400 {
  color: #047857 !important; /* emerald-700 */
}

.light-theme .border-emerald-500\\/20,
.light-theme .border-emerald-500\\/30,
.light-theme .border-emerald-500\\/40,
.light-theme .border-emerald-800,
.light-theme .border-emerald-900\\/30,
.light-theme .border-emerald-900\\/50 {
  border-color: #a7f3d0 !important; /* emerald-200 */
}

/* 7. Status Pills & Badges (Indigo / Blue / In Progress) */
.light-theme .bg-indigo-500\\/10,
.light-theme .bg-indigo-500\\/20,
.light-theme .bg-indigo-500\\/30,
.light-theme .bg-indigo-950\\/20,
.light-theme .bg-indigo-950\\/40,
.light-theme .bg-indigo-950\\/60,
.light-theme .bg-blue-500\\/10,
.light-theme .bg-blue-500\\/20,
.light-theme .bg-blue-950\\/40,
.light-theme .hover\\:bg-indigo-600\\/30:hover {
  background-color: #dbeafe !important; /* blue-100 */
}

.light-theme .text-indigo-200,
.light-theme .text-indigo-300,
.light-theme .text-indigo-400,
.light-theme .text-blue-200,
.light-theme .text-blue-300,
.light-theme .text-blue-400 {
  color: #1d4ed8 !important; /* blue-700 */
}

.light-theme .border-indigo-500\\/20,
.light-theme .border-indigo-500\\/30,
.light-theme .border-indigo-500\\/40,
.light-theme .border-blue-500\\/30 {
  border-color: #bfdbfe !important; /* blue-200 */
}

/* 8. Status Pills & Badges (Amber / Clarification / Pending) */
.light-theme .bg-amber-500\\/10,
.light-theme .bg-amber-500\\/20,
.light-theme .bg-amber-500\\/30,
.light-theme .bg-amber-950\\/20,
.light-theme .bg-amber-950\\/40,
.light-theme .bg-amber-950\\/50,
.light-theme .bg-amber-950\\/60,
.light-theme .bg-orange-500\\/10,
.light-theme .bg-orange-500\\/20 {
  background-color: #fef3c7 !important; /* amber-100 */
}

.light-theme .text-amber-200,
.light-theme .text-amber-300,
.light-theme .text-amber-400,
.light-theme .text-orange-300,
.light-theme .text-orange-400 {
  color: #b45309 !important; /* amber-700 */
}

.light-theme .border-amber-500\\/20,
.light-theme .border-amber-500\\/30,
.light-theme .border-amber-500\\/40,
.light-theme .border-orange-500\\/30 {
  border-color: #fde68a !important; /* amber-200 */
}

/* 9. Status Pills & Badges (Rose / Red / Overdue) */
.light-theme .bg-rose-500\\/10,
.light-theme .bg-rose-500\\/20,
.light-theme .bg-rose-500\\/30,
.light-theme .bg-rose-950\\/20,
.light-theme .bg-rose-950\\/40,
.light-theme .bg-rose-950\\/50,
.light-theme .bg-rose-950\\/60,
.light-theme .bg-red-500\\/10,
.light-theme .bg-red-500\\/20 {
  background-color: #fee2e2 !important; /* red-100 */
}

.light-theme .text-rose-200,
.light-theme .text-rose-300,
.light-theme .text-rose-400,
.light-theme .text-red-300,
.light-theme .text-red-400 {
  color: #b91c1c !important; /* red-700 */
}

.light-theme .border-rose-500\\/20,
.light-theme .border-rose-500\\/30,
.light-theme .border-rose-500\\/40,
.light-theme .border-red-500\\/20 {
  border-color: #fecaca !important; /* red-200 */
}

/* 10. Status Pills & Badges (Purple / Baseline) */
.light-theme .bg-purple-500\\/10,
.light-theme .bg-purple-500\\/20,
.light-theme .bg-purple-500\\/30,
.light-theme .bg-purple-950\\/40 {
  background-color: #f3e8ff !important; /* purple-100 */
}

.light-theme .text-purple-300,
.light-theme .text-purple-400 {
  color: #6b21a8 !important; /* purple-700 */
}

.light-theme .border-purple-500\\/20,
.light-theme .border-purple-500\\/30 {
  border-color: #e9d5ff !important; /* purple-200 */
}

/* 11. Buttons - PROTECT PRIMARY COLORS! */
/* We MUST ensure these maintain white text and don't get overridden by .text-white -> black */
.light-theme button.bg-indigo-600,
.light-theme button.bg-emerald-600,
.light-theme button.bg-cyan-600,
.light-theme button.bg-amber-600,
.light-theme button.bg-rose-600,
.light-theme button.bg-red-600,
.light-theme button.bg-blue-600,
.light-theme button.bg-purple-600,
.light-theme .bg-indigo-600,
.light-theme .bg-emerald-600,
.light-theme .bg-cyan-600,
.light-theme .bg-amber-600,
.light-theme .bg-rose-600,
.light-theme .bg-red-600,
.light-theme .bg-blue-600,
.light-theme .bg-purple-600,
.light-theme .bg-gradient-to-r,
.light-theme .bg-gradient-to-tr,
.light-theme .bg-indigo-500,
.light-theme .bg-blue-500 {
  color: #ffffff !important;
}

/* Fixes for dark mode specific button highlights */
.light-theme button.bg-indigo-900\\/50,
.light-theme a.bg-indigo-900\\/50 {
  background-color: #e0e7ff !important; /* indigo-100 */
  color: #4f46e5 !important; /* indigo-600 */
  border-color: #c7d2fe !important; /* indigo-200 */
}

.light-theme button.hover\\:bg-indigo-800:hover,
.light-theme a.hover\\:bg-indigo-800:hover {
  background-color: #c7d2fe !important; /* indigo-200 */
  color: #3730a3 !important; /* indigo-800 */
}

/* 12. Fix Icons inside Primary Buttons */
.light-theme button.bg-indigo-600 svg,
.light-theme button.bg-emerald-600 svg,
.light-theme button.bg-cyan-600 svg,
.light-theme button.bg-amber-600 svg,
.light-theme button.bg-rose-600 svg,
.light-theme button.bg-blue-600 svg,
.light-theme button.bg-purple-600 svg,
.light-theme .bg-indigo-600 svg,
.light-theme .bg-emerald-600 svg,
.light-theme .bg-gradient-to-r svg,
.light-theme .bg-gradient-to-tr svg,
.light-theme .bg-blue-500 svg,
.light-theme .bg-indigo-500 svg {
  color: #ffffff !important;
}

/* Prevent SVG inheritance issues for plain icons outside of buttons */
.light-theme svg.text-white {
  color: inherit !important;
}

/* 13. Select Inputs */
.light-theme select option {
  background-color: #ffffff !important;
  color: #0f172a !important;
}

/* 14. Document preview styling */
.document-preview-container table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.85rem;
}

.document-preview-container th,
.document-preview-container td {
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.document-preview-container th {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

.document-preview-container p {
  margin-bottom: 0.6rem;
}

.document-preview-container strong {
  color: #0f172a;
}
`;

fs.writeFileSync('src/index.css', css);
console.log('CSS file successfully updated');
