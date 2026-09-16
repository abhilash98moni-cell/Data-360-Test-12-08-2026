import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Split the content to keep everything before .light-theme
prefix = content.split('.light-theme')[0]

new_light_theme = """
.light-theme {
  color-scheme: light;
  background-color: #F5F9FD !important;
  color: #0F172A !important; /* Deep navy text */
}

/* 1. Page Backgrounds (Applied to root elements normally) */
.light-theme main,
.light-theme main.bg-slate-950\\/90 {
  background-color: transparent !important;
}

/* Secondary Panels / Backgrounds */
.light-theme .bg-slate-950,
.light-theme .hover\\:bg-slate-950:hover,
.light-theme .focus\\:bg-slate-950:focus {
  background-color: #EAF4FB !important; /* Secondary background */
}

.light-theme .bg-slate-950\\/90 { background-color: rgba(234, 244, 251, 0.9) !important; }
.light-theme .bg-slate-950\\/80 { background-color: rgba(234, 244, 251, 0.8) !important; }
.light-theme .bg-slate-950\\/60 { background-color: rgba(234, 244, 251, 0.6) !important; }
.light-theme .bg-slate-950\\/40 { background-color: rgba(234, 244, 251, 0.4) !important; }
.light-theme .bg-slate-950\\/30 { background-color: rgba(234, 244, 251, 0.3) !important; }
.light-theme .bg-slate-950\\/20 { background-color: rgba(234, 244, 251, 0.2) !important; }

/* -------------------------------------------------- */
/* SIDEBAR (EEF6FC) */
/* -------------------------------------------------- */
.light-theme aside.bg-slate-900 {
  background-color: #EEF6FC !important; /* Very soft blue-white shade */
  border-right-color: #DCE4EF !important;
}

/* Sidebar Text */
.light-theme aside.bg-slate-900 .text-slate-400,
.light-theme aside.bg-slate-900 .text-slate-300 {
  color: #334155 !important; /* Deep navy / blue-gray */
}
.light-theme aside.bg-slate-900 .text-slate-500 {
  color: #475569 !important; /* Slightly lighter deep navy */
}
.light-theme aside.bg-slate-900 .hover\\:text-slate-100:hover,
.light-theme aside.bg-slate-900 .hover\\:text-white:hover {
  color: #0F172A !important;
}

/* Sidebar Selected Navigation */
.light-theme aside.bg-slate-900 button.bg-indigo-600,
.light-theme aside.bg-slate-900 button.bg-gradient-to-r {
  background-color: #DBEAFE !important; /* Soft blue background */
  background-image: none !important;
  color: #1D4ED8 !important; /* Blue accent */
  box-shadow: inset 3px 0 0 0 #2563EB !important; /* subtle left indicator */
}
.light-theme aside.bg-slate-900 button.bg-indigo-600 svg,
.light-theme aside.bg-slate-900 button.bg-gradient-to-r svg {
  color: #2563EB !important; /* Selected icon: medium blue */
}

/* Sidebar Admin Settings Expansion */
.light-theme aside.bg-slate-900 button.bg-slate-800\\/80 {
  background-color: #E2F0FA !important;
  color: #0F172A !important;
  border-color: #DCE4EF !important;
}

/* -------------------------------------------------- */
/* TOP HEADER (FFFFFF) */
/* -------------------------------------------------- */
.light-theme header.bg-slate-900 {
  background-color: #FFFFFF !important; /* White / very pale blue base */
  border-bottom-color: #DCE4EF !important; /* Soft blue borders */
}
.light-theme header.bg-slate-900 .text-slate-400 {
  color: #475569 !important;
}

/* -------------------------------------------------- */
/* MAIN CARDS (FFFFFF) */
/* -------------------------------------------------- */
.light-theme .bg-slate-900,
.light-theme .bg-slate-850 {
  background-color: #FFFFFF !important;
  box-shadow: 0 1px 3px 0 rgba(37, 99, 235, 0.05), 0 1px 2px -1px rgba(37, 99, 235, 0.05) !important;
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
  background-color: #F8FAFE !important;
}

/* -------------------------------------------------- */
/* SECONDARY SURFACES / SUBTLE BLUE SECTION */
/* -------------------------------------------------- */
.light-theme .bg-slate-800,
.light-theme .hover\\:bg-slate-800:hover {
  background-color: #E2F0FA !important; /* Subtle blue section */
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

/* -------------------------------------------------- */
/* BORDERS (Very light blue-gray) */
/* -------------------------------------------------- */
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
  border-color: #DCE4EF !important;
}
.light-theme .hover\\:border-slate-700:hover {
  border-color: #B0C4DE !important;
}

/* -------------------------------------------------- */
/* TYPOGRAPHY */
/* -------------------------------------------------- */
.light-theme .text-slate-100,
.light-theme .text-slate-200,
.light-theme .text-white,
.light-theme .hover\\:text-slate-200:hover,
.light-theme .hover\\:text-white:hover {
  color: #0F172A !important;
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
.light-theme .text-indigo-500 { color: #2563EB !important; } /* Medium Blue */
.light-theme .text-amber-500 { color: #D97706 !important; }
.light-theme .text-rose-500 { color: #E11D48 !important; }
.light-theme .text-purple-500 { color: #7C3AED !important; }

/* Ensure placeholder text is legible */
.light-theme .placeholder\\:text-slate-500::placeholder {
  color: #94A3B8 !important;
}

/* -------------------------------------------------- */
/* STATUS PILLS & BADGES */
/* -------------------------------------------------- */

/* Emerald / Success */
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

/* Indigo / Blue / Cyan / In Progress */
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
  background-color: #E2F0FA !important; /* Cyan / Sky Blue tint */
}
.light-theme .text-indigo-200,
.light-theme .text-indigo-300,
.light-theme .text-indigo-400,
.light-theme .text-blue-200,
.light-theme .text-blue-300,
.light-theme .text-blue-400 {
  color: #2563EB !important; /* Medium Blue */
}
.light-theme .border-indigo-500\\/20,
.light-theme .border-indigo-500\\/30,
.light-theme .border-indigo-500\\/40,
.light-theme .border-blue-500\\/30 {
  border-color: #BFDBFE !important;
}

/* Amber / Clarification / Pending */
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

/* Rose / Red / Overdue */
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

/* Purple / Baseline */
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

/* -------------------------------------------------- */
/* PRIMARY BUTTONS (Medium Blue / Cyan) */
/* -------------------------------------------------- */
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

/* Remap Indigo to Medium Blue for primary actions */
.light-theme button.bg-indigo-600,
.light-theme .bg-indigo-600,
.light-theme button.bg-indigo-500,
.light-theme .bg-indigo-500,
.light-theme button.bg-blue-600,
.light-theme .bg-blue-600 {
  background-color: #2563EB !important; /* Medium blue */
  border-color: #1D4ED8 !important;
}
.light-theme button.hover\\:bg-indigo-600:hover,
.light-theme button.hover\\:bg-indigo-700:hover,
.light-theme button.hover\\:bg-indigo-500:hover,
.light-theme button.hover\\:bg-blue-600:hover {
  background-color: #1D4ED8 !important;
}

/* Remap light indigo highlights to Cyan/Sky blue accents */
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

/* Fix Icons inside Primary Buttons */
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

/* -------------------------------------------------- */
/* SELECT INPUTS & PREVIEWS */
/* -------------------------------------------------- */
.light-theme select option {
  background-color: #ffffff !important;
  color: #0F172A !important;
}

/* Document preview styling */
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
  color: #0F172A;
  font-weight: 600;
}
.document-preview-container p {
  margin-bottom: 0.6rem;
}
.document-preview-container strong {
  color: #0F172A;
}

/* Additional hover states */
.light-theme .hover\\:bg-purple-900\\/60:hover {
  background-color: #E9D5FF !important;
}

/* Fix hover text-white inside buttons that are light in light-mode */
.light-theme .hover\\:text-white:hover {
  color: #0F172A !important;
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
}
"""

with open('src/index.css', 'w') as f:
    f.write(prefix + new_light_theme)

