import re

with open('src/index.css', 'r') as f:
    content = f.read()

if '.light-theme {' in content:
    prefix = content.split('.light-theme {')[0]
else:
    prefix = content

new_css = """
.light-theme {
  color-scheme: light;
  background-color: #EEF6FC !important;
  color: #102A43 !important;
}

/* -------------------------------------------------- */
/* 1. GLOBAL LIGHT-MODE BACKGROUND */
/* -------------------------------------------------- */
.light-theme body,
.light-theme main,
.light-theme main.bg-slate-950\\/90,
.light-theme .min-h-screen.bg-slate-950 {
  background-color: #EEF6FC !important;
  background-image: none !important;
}

/* -------------------------------------------------- */
/* 2. NAVIGATION SIDEBAR */
/* -------------------------------------------------- */
.light-theme aside.bg-slate-900,
.light-theme aside.bg-slate-950 {
  background-color: #F4F9FD !important;
  border-right-color: #D5E5F2 !important;
}
.light-theme aside .text-slate-300,
.light-theme aside .hover\\:text-white:hover,
.light-theme aside .text-white {
  color: #233B53 !important;
}
.light-theme aside .text-slate-400,
.light-theme aside .text-slate-500 {
  color: #60758A !important;
}
/* Active Nav */
.light-theme aside button.bg-indigo-600,
.light-theme aside button.bg-gradient-to-r,
.light-theme aside .bg-gradient-to-r {
  background: linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%) !important;
  color: #FFFFFF !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15) !important;
}
.light-theme aside button.bg-indigo-600 svg,
.light-theme aside button.bg-gradient-to-r svg {
  color: #FFFFFF !important;
}
.light-theme aside button.bg-slate-800\\/80 {
  background-color: #E5F1FA !important;
  color: #233B53 !important;
  border-color: #D5E5F2 !important;
}

/* -------------------------------------------------- */
/* 3. TOP HEADER */
/* -------------------------------------------------- */
.light-theme header.bg-slate-900 {
  background-color: #FFFFFF !important;
  border-bottom-color: #D9E7F2 !important;
}
.light-theme header.bg-slate-900 .text-slate-300,
.light-theme header.bg-slate-900 .text-white {
  color: #102A43 !important;
}
.light-theme header.bg-slate-900 .text-slate-400 {
  color: #60758A !important;
}
/* Search Field */
.light-theme header.bg-slate-900 input,
.light-theme header.bg-slate-900 .bg-slate-950,
.light-theme header.bg-slate-900 .bg-slate-950\\/50 {
  background-color: #F1F7FC !important;
  border-color: #C9DCEB !important;
  color: #334E68 !important;
}
.light-theme header.bg-slate-900 input::placeholder {
  color: #829AB1 !important;
}

/* -------------------------------------------------- */
/* 4. CARDS AND PANELS */
/* -------------------------------------------------- */
/* Primary Cards */
.light-theme .bg-slate-900,
.light-theme .bg-slate-850,
.light-theme .from-slate-900,
.light-theme .to-slate-900,
.light-theme .via-indigo-950\\/60,
.light-theme .via-indigo-950\\/70,
.light-theme .via-indigo-950\\/50,
.light-theme .via-slate-900,
.light-theme .bg-slate-900\\/90,
.light-theme .bg-slate-900\\/80 {
  background-color: #FFFFFF !important;
  background-image: none !important;
  box-shadow: 0 4px 16px rgba(31, 78, 121, 0.08) !important;
  border-color: #D5E5F2 !important;
}
/* Secondary cards */
.light-theme .bg-slate-950,
.light-theme .bg-slate-950\\/90,
.light-theme .bg-slate-950\\/80,
.light-theme .bg-slate-950\\/60,
.light-theme .bg-slate-950\\/50,
.light-theme .bg-slate-950\\/40 {
  background-color: #F5FAFE !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: #D5E5F2 !important;
}
/* Blue-tinted cards / subtle surfaces */
.light-theme .bg-slate-800,
.light-theme .bg-slate-800\\/80,
.light-theme .bg-slate-800\\/60,
.light-theme .bg-slate-800\\/50,
.light-theme .bg-slate-800\\/40,
.light-theme .bg-slate-800\\/30,
.light-theme .bg-indigo-950\\/40,
.light-theme .bg-indigo-950\\/20,
.light-theme .bg-indigo-950,
.light-theme .bg-indigo-950\\/80 {
  background-color: #EAF4FB !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: #D5E5F2 !important;
}

/* -------------------------------------------------- */
/* 5. PRIMARY BLUE & 6. CYAN ACCENT */
/* -------------------------------------------------- */
.light-theme button.bg-indigo-600,
.light-theme button.bg-blue-600,
.light-theme .bg-indigo-600,
.light-theme .bg-blue-600,
.light-theme button.bg-gradient-to-r.from-indigo-600,
.light-theme .bg-gradient-to-r.from-indigo-600,
.light-theme button.bg-gradient-to-tr.from-indigo-600 {
  background: linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%) !important;
  border-color: #1D4ED8 !important;
  color: #FFFFFF !important;
}
.light-theme button.hover\\:bg-indigo-500:hover,
.light-theme button.hover\\:bg-blue-500:hover {
  background: linear-gradient(90deg, #1D4ED8 0%, #0F2D4A 100%) !important;
  color: #FFFFFF !important;
}

/* Active indicators / Cyan accents */
.light-theme .bg-cyan-500,
.light-theme .text-cyan-400 {
  color: #06B6D4 !important;
}
.light-theme .bg-cyan-500\\/20 {
  background-color: #D9F5FA !important;
}

/* -------------------------------------------------- */
/* 7. GRADIENTS */
/* -------------------------------------------------- */
/* Convert dark gradients to subtle blue gradients */
.light-theme .bg-gradient-to-r.from-slate-900,
.light-theme .bg-gradient-to-r.from-slate-950 {
  background: linear-gradient(90deg, #FFFFFF 0%, #EAF4FB 100%) !important;
}
.light-theme .bg-gradient-to-tr.from-slate-900 {
  background: linear-gradient(45deg, #EFF7FF 0%, #DCECF8 100%) !important;
}
.light-theme .from-indigo-950\\/90 {
  background-color: #F5FAFE !important;
  background-image: none !important;
}

/* -------------------------------------------------- */
/* 8. TYPOGRAPHY */
/* -------------------------------------------------- */
/* Catch-all text colours */
.light-theme,
.light-theme .text-slate-100,
.light-theme .text-slate-200,
.light-theme .text-slate-300,
.light-theme .text-white {
  color: #102A43 !important;
}
/* Restore white text for true primary coloured elements */
.light-theme .bg-indigo-600,
.light-theme .bg-blue-600,
.light-theme .bg-emerald-600,
.light-theme .bg-rose-600,
.light-theme .bg-red-600,
.light-theme .bg-cyan-600,
.light-theme .bg-gradient-to-r.from-indigo-600,
.light-theme .bg-gradient-to-tr.from-indigo-600 {
  color: #FFFFFF !important;
}
.light-theme .bg-indigo-600 .text-white,
.light-theme .bg-blue-600 .text-white,
.light-theme .bg-emerald-600 .text-white,
.light-theme .bg-rose-600 .text-white,
.light-theme .bg-red-600 .text-white,
.light-theme .bg-gradient-to-r.from-indigo-600 .text-white,
.light-theme .bg-gradient-to-tr.from-indigo-600 .text-white {
  color: #FFFFFF !important;
}
.light-theme button.bg-indigo-600 svg,
.light-theme button.bg-blue-600 svg,
.light-theme button.bg-emerald-600 svg,
.light-theme button.bg-gradient-to-r.from-indigo-600 svg,
.light-theme .bg-indigo-600 svg,
.light-theme .bg-gradient-to-r.from-indigo-600 svg {
  color: #FFFFFF !important;
}

/* Secondary & Muted */
.light-theme .text-slate-400,
.light-theme .text-slate-400\\/80 {
  color: #486581 !important;
}
.light-theme .text-slate-500,
.light-theme .text-slate-600 {
  color: #829AB1 !important;
}

/* -------------------------------------------------- */
/* 9. TABLES */
/* -------------------------------------------------- */
.light-theme table,
.light-theme .table-container {
  background-color: #FFFFFF !important;
}
.light-theme thead,
.light-theme tr.bg-slate-950,
.light-theme th,
.light-theme tr.bg-slate-900\\/50 {
  background-color: #EAF4FB !important;
  color: #486581 !important;
}
.light-theme tbody tr {
  border-bottom-color: #D9E7F2 !important;
}
.light-theme tbody td,
.light-theme tbody tr {
  color: #243B53 !important;
}
.light-theme tbody tr.hover\\:bg-slate-800\\/50:hover,
.light-theme tbody tr.hover\\:bg-slate-900\\/50:hover,
.light-theme tbody tr:hover {
  background-color: #F1F8FD !important;
}
.light-theme tr.bg-indigo-900\\/20,
.light-theme tr.bg-slate-800\\/40 {
  background-color: #E0F0FF !important;
}

/* -------------------------------------------------- */
/* 10. FORMS / INPUTS / DROPDOWNS */
/* -------------------------------------------------- */
.light-theme input,
.light-theme textarea,
.light-theme select {
  background-color: #FFFFFF !important;
  border-color: #C9DCEB !important;
  color: #102A43 !important;
}
.light-theme input:focus,
.light-theme textarea:focus,
.light-theme select:focus {
  border-color: #2563EB !important;
  background-color: #F7FBFF !important;
}
.light-theme input::placeholder,
.light-theme textarea::placeholder {
  color: #829AB1 !important;
}

/* -------------------------------------------------- */
/* 11. STATUS COLOURS */
/* -------------------------------------------------- */
/* SUCCESS */
.light-theme .bg-emerald-500\\/10, .light-theme .bg-emerald-500\\/20, .light-theme .bg-emerald-950\\/40, .light-theme .bg-emerald-950\\/60 {
  background-color: #E7F8F0 !important;
  border-color: #A7F3D0 !important;
}
.light-theme .text-emerald-400, .light-theme .text-emerald-300, .light-theme .text-emerald-500 {
  color: #087443 !important;
}
/* WARNING */
.light-theme .bg-amber-500\\/10, .light-theme .bg-amber-500\\/20, .light-theme .bg-amber-950\\/40, .light-theme .bg-amber-950\\/60, .light-theme .bg-orange-500\\/20 {
  background-color: #FFF6D8 !important;
  border-color: #FDE68A !important;
}
.light-theme .text-amber-400, .light-theme .text-amber-300, .light-theme .text-amber-500, .light-theme .text-orange-400 {
  color: #9A6700 !important;
}
/* ERROR / OVERDUE */
.light-theme .bg-rose-500\\/10, .light-theme .bg-rose-500\\/20, .light-theme .bg-rose-950\\/40, .light-theme .bg-rose-950\\/60, .light-theme .bg-red-500\\/20 {
  background-color: #FDECEC !important;
  border-color: #FECACA !important;
}
.light-theme .text-rose-400, .light-theme .text-rose-300, .light-theme .text-rose-500, .light-theme .text-red-400 {
  color: #C62828 !important;
}
/* INFO */
.light-theme .bg-indigo-500\\/10, .light-theme .bg-indigo-500\\/20, .light-theme .bg-indigo-950\\/40, .light-theme .bg-indigo-950\\/60, .light-theme .bg-blue-500\\/20 {
  background-color: #EAF2FF !important;
  border-color: #BFDBFE !important;
}
.light-theme .text-indigo-400, .light-theme .text-indigo-300, .light-theme .text-indigo-500, .light-theme .text-blue-400 {
  color: #175CD3 !important;
}
/* PENDING / MUTED */
.light-theme .bg-slate-500\\/10, .light-theme .bg-slate-800\\/80 {
  background-color: #EEF3F7 !important;
  border-color: #C9DCEB !important;
}

/* -------------------------------------------------- */
/* 12. PROGRESS BARS / DATA VISUALIZATION */
/* -------------------------------------------------- */
.light-theme .bg-indigo-500.h-2\\.5, .light-theme .bg-indigo-500.h-2, .light-theme .bg-blue-500.h-2\\.5 {
  background-color: #2563EB !important;
  background-image: none !important;
}
.light-theme .bg-cyan-500.h-2\\.5, .light-theme .bg-cyan-500.h-2 {
  background-color: #06B6D4 !important;
  background-image: none !important;
}
.light-theme .bg-emerald-500.h-2\\.5, .light-theme .bg-emerald-500.h-2, .light-theme .bg-teal-500.h-2\\.5 {
  background-color: #12B76A !important;
  background-image: none !important;
}
.light-theme .bg-amber-500.h-2\\.5, .light-theme .bg-amber-500.h-2 {
  background-color: #F2A900 !important;
  background-image: none !important;
}
.light-theme .bg-rose-500.h-2\\.5, .light-theme .bg-rose-500.h-2, .light-theme .bg-red-500.h-2\\.5 {
  background-color: #E5484D !important;
  background-image: none !important;
}

/* -------------------------------------------------- */
/* BORDERS & MISC DEFAULTS */
/* -------------------------------------------------- */
.light-theme .border-slate-800,
.light-theme .border-slate-700,
.light-theme .border-slate-600,
.light-theme .border-indigo-500\\/30,
.light-theme .border-indigo-500\\/25,
.light-theme .divide-slate-800\\/80 > :not([hidden]) ~ :not([hidden]),
.light-theme .divide-slate-800 > :not([hidden]) ~ :not([hidden]),
.light-theme .border-b-slate-800,
.light-theme .border-t-slate-800,
.light-theme .border-l-slate-800,
.light-theme .border-r-slate-800 {
  border-color: #D5E5F2 !important;
}

/* -------------------------------------------------- */
/* 13. REMOVE LEFTOVER DARK-MODE STYLING */
/* -------------------------------------------------- */
/* Modal / Dialog Backgrounds */
.light-theme .bg-slate-900.relative,
.light-theme .fixed .bg-slate-900 {
  background-color: #FFFFFF !important;
  border-color: #D5E5F2 !important;
}

/* "View Sample", "Instruction", IRL headers, Chat bubbles */
.light-theme .bg-indigo-950\\/80,
.light-theme .bg-indigo-900 {
  background-color: #EAF4FB !important;
  color: #175CD3 !important;
  border-color: #BFDBFE !important;
}
.light-theme .bg-indigo-950\\/80.text-indigo-300 svg {
  color: #2563EB !important;
}

/* Timeline sections / auditor reviews */
.light-theme .bg-amber-950\\/30,
.light-theme .bg-amber-950\\/40 {
  background-color: #FFF6D8 !important;
  border-color: #FDE68A !important;
  color: #9A6700 !important;
}

/* Chat bubble - sender */
.light-theme .bg-indigo-600.text-white {
  background: linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%) !important;
  color: #FFFFFF !important;
}
/* Chat bubble - receiver */
.light-theme .bg-slate-800.text-slate-200,
.light-theme .bg-slate-800.text-slate-300 {
  background-color: #F1F7FC !important;
  color: #102A43 !important;
}

/* Data Viz / Charts text */
.light-theme text.fill-slate-400 {
  fill: #60758A !important;
}

/* Prevent empty state dark backgrounds */
.light-theme .bg-slate-900\\/50,
.light-theme .bg-slate-800\\/30 {
  background-color: #F5FAFE !important;
}
}
"""

with open('src/index.css', 'w') as f:
    f.write(prefix + new_css)
