const fs = require('fs');

let wp = fs.readFileSync('src/components/WordReportEditor.tsx', 'utf-8');
if (!wp.includes('.hide-on-print')) {
    wp = wp.replace('</style>', '  .hide-on-print { display: none !important; }\n          </style>');
    fs.writeFileSync('src/components/WordReportEditor.tsx', wp);
}

let rp = fs.readFileSync('src/components/ReportPreview.tsx', 'utf-8');
if (!rp.includes('.hide-on-print')) {
    rp = rp.replace('hr { display: none; }', 'hr { display: none; }\n        @media print { .hide-on-print { display: none !important; } }');
    fs.writeFileSync('src/components/ReportPreview.tsx', rp);
}

console.log('hide-on-print patched');
