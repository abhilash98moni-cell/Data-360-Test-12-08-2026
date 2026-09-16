import re

with open('src/index.css', 'r') as f:
    content = f.read()

prefix = content.split('.light-theme')[0]

new_light_theme = """
.light-theme {
  color-scheme: light;
  background-color: #F5F9FD !important;
  color: #0B192C !important;
}

/* 1. Page Backgrounds */
.light-theme main,
.light-theme main.bg-slate-950\\/90 {
  background-color: transparent !important;
}

.light-theme .bg-slate-950,
.light-theme .hover\\:bg-slate-950:hover,
.light-theme .focus\\:bg-slate-950:focus {
  background-color: #EAF4FB !important;
}

.light-theme .bg-slate-950\\/90 { background-color: rgba(234, 244, 251, 0.9) !important; }
.light-theme .bg-slate-950\\/80 { background-color: rgba(234, 244, 251, 0.8) !important; }
.light-theme .bg-slate-950\\/60 { background-color: rgba(234, 244, 251, 0.6) !important; }
.light-theme .bg-slate-950\\/40 { background-color: rgba(234, 244, 251, 0.4) !important; }
.light-theme .bg-slate-950\\/30 { background-color: rgba(234, 244, 251, 0.3) !important; }
.light-theme .bg-slate-950\\/20 { background-color: rgba(234, 244, 251, 0.2) !important; }

/* Special override for sidebar */
.light-theme aside.bg-slate-900 {
  background-color: #EEF6FC !important;
}

/* Special override for header */
.light-theme header.bg-slate-900 {
  background-color: #FFFFFF !important;
}

/* 2. Primary Surfaces (Cards, Modals, KPI Cards) */
.light-theme .bg-slate-900,
.light-theme .bg-slate-850 {
  background-color: #FFFFFF !important;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.05), 0 2px 4px -2px rgba(37, 99, 235, 0.03) !important;
}
.light-theme .bg-slate-900\\/90 { background-color: rgba(255, 255, 255, 0.9) !important; }
.light-theme .bg-slate-900\\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
.light-theme .bg-slate-900\\/60 { background-color: rgba(255, 255, 255, 0.6) !important; }
.light-theme .bg-slate-900\\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
.light-theme .bg-slate-900\\/40 { background-color: rgba(255, 255, 255, 0.4) !important; }
.light-theme .hover\\:bg-slate-900:hover,
.light-theme .hover\\:bg-slate-900\\/50:hover,
.light-theme .hover\\:bg-slate-900\\/60:hover,
.light-theme .focus\\:bg-slate-900:focus {
  background-color: #F3F8FC !important;
}

/* 3. Secondary Surfaces (Table Headers, Hover States, Search Bars) */
.light-theme .bg-slate-800,
.light-theme .hover\\:bg-slate-800:hover {
  background-color: #E2F0FA !important;
}
.light-theme .bg-slate-800\\/80, .light-theme .hover\\:bg-slate-800\\/80:hover { background-color: rgba(226, 240, 250, 0.8) !important; }
.light-theme .bg-slate-800\\/60, .light-theme .hover\\:bg-slate-800\\/60:hover { background-color: rgba(226, 240, 250, 0.6) !important; }
.light-theme .bg-slate-800\\/50, .light-theme .hover\\:bg-slate-800\\/50:hover { background-color: rgba(226, 240, 250, 0.5) !important; }
.light-theme .bg-slate-800\\/40, .light-theme .hover\\:bg-slate-800\\/40:hover { background-color: rgba(226, 240, 250, 0.4) !important; }
.light-theme .bg-slate-800\\/30, .light-theme .hover\\:bg-slate-800\\/30:hover { background-color: rgba(226, 240, 250, 0.3) !important; }

/* Remove box-shadow when hovering elements that shouldn't look like floating cards */
.light-theme button.hover\\:bg-slate-800:hover,
.light-theme tr.hover\\:bg-slate-800:hover,
.light-theme tr.hover\\:bg-slate-800\\/50:hover {
  box-shadow: none !important;
}

/* Inputs and interactive elements */
.light-theme input,
.light-theme textarea,
.light-theme select {
  background-color: #FFFFFF !important;
}
.light-theme .bg-slate-700,
.light-theme .bg-slate-750,
.light-theme .hover\\:bg-slate-700:hover {
  background-color: #D6E8F6 !important;
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
  border-color: #D9E8F5 !important;
}
.light-theme .hover\\:border-slate-700:hover {
  border-color: #C2D9F0 !important;
}

/* 5. Typography */
.light-theme .text-slate-100,
.light-theme .text-slate-200,
.light-theme .text-white,
.light-theme .hover\\:text-slate-200:hover,
.light-theme .hover\\:text-white:hover {
  color: #0B192C !important;
}
.light-theme .text-slate-300,
.light-theme .text-slate-400,
.light-theme .text-slate-400\\/80 {
  color: #334155 !important;
}
.light-theme .text-slate-500 {
  color: #64748B !important;
}

/* Additional text colors */
.light-theme .text-emerald-500 { color: #059669 !important; }
.light-theme .text-indigo-500 { color: #2563EB !important; } /* mapped to medium blue */
.light-theme .text-amber-500 { color: #D97706 !important; }
.light-theme .text-rose-500 { color: #E11D48 !important; }
.light-theme .text-purple-500 { color: #7C3AED !important; }

/* Ensure placeholder text is legible */
.light-theme .placeholder\\:text-slate-500::placeholder {
  color: #94A3B8 !important;
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
  background-color: #D1FAE5 !important;
}
.light-theme .text-emerald-200,
.light-theme .text-emerald-300,
.light-theme .text-emerald-400 {
  color: #059669 !important;
}
.light-theme .border-emerald-500\\/20,
.light-theme .border-emerald-500\\/30,
.light-theme .border-emerald-500\\/40,
.light-theme .border-emerald-800,
.light-theme .border-emerald-900\\/30,
.light-theme .border-emerald-900\\/50 {
  border-color: #A7F3D0 !important;
}

/* 7. Status Pills & Badges (Indigo / Blue / In Progress) */
/* Using medium blue/cyan highlights */
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
  background-color: #DBEAFE !important;
}
.light-theme .text-indigo-200,
.light-theme .text-indigo-300,
.light-theme .text-indigo-400,
.light-theme .text-blue-200,
.light-theme .text-blue-300,
.light-theme .text-blue-400 {
  color: #2563EB !important;
}
.light-theme .border-indigo-500\\/20,
.light-theme .border-indigo-500\\/30,
.light-theme .border-indigo-500\\/40,
.light-theme .border-blue-500\\/30 {
  border-color: #BFDBFE !important;
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
  background-color: #FEF3C7 !important;
}
.light-theme .text-amber-200,
.light-theme .text-amber-300,
.light-theme .text-amber-400,
.light-theme .text-orange-300,
.light-theme .text-orange-400 {
  color: #D97706 !important;
}
.light-theme .border-amber-500\\/20,
.light-theme .border-amber-500\\/30,
.light-theme .border-amber-500\\/40,
.light-theme .border-orange-500\\/30 {
  border-color: #FDE68A !important;
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
  background-color: #FEE2E2 !important;
}
.light-theme .text-rose-200,
.light-theme .text-rose-300,
.light-theme .text-rose-400,
.light-theme .text-red-300,
.light-theme .text-red-400 {
  color: #E11D48 !important;
}
.light-theme .border-rose-500\\/20,
.light-theme .border-rose-500\\/30,
.light-theme .border-rose-500\\/40,
.light-theme .border-red-500\\/20 {
  border-color: #FECACA !important;
}

/* 10. Status Pills & Badges (Purple / Baseline) */
.light-theme .bg-purple-500\\/10,
.light-theme .bg-purple-500\\/20,
.light-theme .bg-purple-500\\/30,
.light-theme .bg-purple-950\\/40 {
  background-color: #F3E8FF !important;
}
.light-theme .text-purple-300,
.light-theme .text-purple-400 {
  color: #7C3AED !important;
}
.light-theme .border-purple-500\\/20,
.light-theme .border-purple-500\\/30 {
  border-color: #E9D5FF !important;
}

/* 11. Buttons - PROTECT PRIMARY COLORS! */
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
/* Re-map indigo button backgrounds to medium blue #2563EB where appropriate, but Tailwind handles colors, so we just override the indigo-900 highlight ones */
.light-theme button.bg-indigo-900\\/50,
.light-theme a.bg-indigo-900\\/50 {
  background-color: #DBEAFE !important;
  color: #2563EB !important;
  border-color: #BFDBFE !important;
}
.light-theme button.hover\\:bg-indigo-800:hover,
.light-theme a.hover\\:bg-indigo-800:hover {
  background-color: #BFDBFE !important;
  color: #1D4ED8 !important;
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
  color: #0B192C !important;
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
  background-color: #F1F5F9;
  color: #0B192C;
  font-weight: 600;
}
.document-preview-container p {
  margin-bottom: 0.6rem;
}
.document-preview-container strong {
  color: #0B192C;
}

/* Additional hover states for header badges */
.light-theme .hover\\:bg-purple-900\\/60:hover {
  background-color: #E9D5FF !important;
}

/* Fix hover text-white inside buttons that are light in light-mode */
.light-theme .hover\\:text-white:hover {
  color: #0B192C !important;
}

/* Force white text on hover for primary colored buttons even if they have hover:text-white */
.light-theme button.hover\\:bg-indigo-600:hover,
.light-theme button.hover\\:bg-blue-600:hover,
.light-theme button.hover\\:bg-emerald-600:hover,
.light-theme button.hover\\:bg-rose-600:hover,
.light-theme button.hover\\:bg-purple-600:hover,
.light-theme button.bg-indigo-600.hover\\:text-white:hover,
.light-theme button.bg-blue-600.hover\\:text-white:hover {
  color: #ffffff !important;
}
"""

with open('src/index.css', 'w') as f:
    f.write(prefix + new_light_theme)

