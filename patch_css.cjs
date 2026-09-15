const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Move bg-slate-950 rules from "Page Backgrounds" to "Primary Surfaces"
css = css.replace(/\\/\\* 1\\. Page Backgrounds \\*\\/[\\s\\S]*?\\/\\* 2\\. Primary Surfaces \\(Cards, Modals\\) \\*\\//, 
`/* 1. Page Backgrounds */
.light-theme.bg-slate-950 { /* Only if applied directly alongside light-theme, but App.tsx uses bg-slate-50 */ }

/* 2. Primary Surfaces (Cards, Modals) */
.light-theme .bg-slate-950,
.light-theme .bg-slate-950\\/90,
.light-theme .bg-slate-950\\/80,
.light-theme .bg-slate-950\\/60,
.light-theme .bg-slate-950\\/40,
.light-theme .bg-slate-950\\/30,
.light-theme .bg-slate-950\\/20,
.light-theme .hover\\:bg-slate-950:hover,
.light-theme .focus\\:bg-slate-950:focus,`);

fs.writeFileSync('src/index.css', css);
console.log('CSS updated for bg-slate-950');
