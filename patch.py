import sys

with open('src/index.css', 'r') as f:
    lines = f.readlines()

new_header = """@import "tailwindcss";

.light-theme {
  color-scheme: light;
  background-color: #F4F7FC !important;
  color: #14213D !important;
}

/* 1. Page Backgrounds (Applied to root elements normally) */
.light-theme.bg-slate-50,
.light-theme .bg-slate-950 {
  background-color: #F4F7FC !important;
}

/* Maintain Canvas on elements mapping to main */
.light-theme main.bg-slate-950\/90 {
  background-color: transparent !important;
}

/* Allow other 950s (like headers and panels) to be F8FAFE (Secondary Surface) */
.light-theme .bg-slate-950,
.light-theme .bg-slate-950\/90,
.light-theme .bg-slate-950\/80,
.light-theme .bg-slate-950\/60,
.light-theme .bg-slate-950\/40,
.light-theme .bg-slate-950\/30,
.light-theme .bg-slate-950\/20,
.light-theme .hover\:bg-slate-950:hover,
.light-theme .focus\:bg-slate-950:focus {
  background-color: #F8FAFE !important;
}

/* Make sure the main element is transparent so it shows root */
.light-theme main {
  background-color: transparent !important;
}

/* 2. Primary Surfaces (Cards, Modals, KPI Cards, Sidebar, Header) */
.light-theme .bg-slate-900,
.light-theme .bg-slate-900\/90,
.light-theme .bg-slate-900\/80,
.light-theme .bg-slate-900\/60,
.light-theme .bg-slate-900\/50,
.light-theme .bg-slate-900\/40,
.light-theme .bg-slate-850 {
  background-color: #FFFFFF !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03) !important;
}

.light-theme .hover\:bg-slate-900:hover,
.light-theme .hover\:bg-slate-900\/50:hover,
.light-theme .hover\:bg-slate-900\/60:hover,
.light-theme .focus\:bg-slate-900:focus {
  background-color: #F0F4FA !important;
}

/* 3. Secondary Surfaces (Table Headers, Hover States, Search Bars) */
.light-theme .bg-slate-800,
.light-theme .bg-slate-800\/80,
.light-theme .bg-slate-800\/60,
.light-theme .bg-slate-800\/50,
.light-theme .bg-slate-800\/40,
.light-theme .bg-slate-800\/30,
.light-theme .hover\:bg-slate-800:hover,
.light-theme .hover\:bg-slate-800\/80:hover,
.light-theme .hover\:bg-slate-800\/50:hover,
.light-theme .hover\:bg-slate-800\/40:hover,
.light-theme .hover\:bg-slate-800\/30:hover {
  background-color: #F1F6FC !important;
}

/* Inputs and interactive elements */
.light-theme input,
.light-theme textarea,
.light-theme select {
  background-color: #F8FAFE !important;
}

/* Remove box-shadow when hovering elements that shouldn't look like floating cards */
.light-theme button.hover\:bg-slate-800:hover,
.light-theme tr.hover\:bg-slate-800:hover,
.light-theme tr.hover\:bg-slate-800\/50:hover {
  box-shadow: none !important;
}

.light-theme .bg-slate-700,
.light-theme .bg-slate-750,
.light-theme .hover\:bg-slate-700:hover {
  background-color: #E7EDF5 !important;
}

/* 4. Borders */
.light-theme .border-slate-800,
.light-theme .border-slate-800\/80,
.light-theme .border-slate-800\/50,
.light-theme .border-slate-800\/40,
.light-theme .border-slate-800\/30,
.light-theme .border-slate-700,
.light-theme .border-slate-700\/80,
.light-theme .border-slate-600,
.light-theme .border-slate-900,
.light-theme .border-slate-900\/30,
.light-theme .border-slate-900\/50,
.light-theme .divide-slate-800\/80,
.light-theme .divide-slate-800 > :not([hidden]) ~ :not([hidden]),
.light-theme .border-b-slate-800,
.light-theme .border-t-slate-800,
.light-theme .border-l-slate-800,
.light-theme .border-r-slate-800 {
  border-color: #DCE4EF !important;
}

.light-theme .hover\:border-slate-700:hover {
  border-color: #B0C4DE !important;
}

/* 5. Typography */
.light-theme .text-slate-100,
.light-theme .text-slate-200,
.light-theme .text-white,
.light-theme .hover\:text-slate-200:hover,
.light-theme .hover\:text-white:hover {
  color: #14213D !important;
}

.light-theme .text-slate-300,
.light-theme .text-slate-400,
.light-theme .text-slate-400\/80 {
  color: #5F6F85 !important;
}

.light-theme .text-slate-500 {
  color: #8A98AA !important;
}

"""

with open('src/index.css', 'w') as f:
    f.write(new_header)
    f.writelines(lines[114:])

print("Patched index.css")
