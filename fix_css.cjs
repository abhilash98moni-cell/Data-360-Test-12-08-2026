const fs = require('fs');
let wp = fs.readFileSync('src/components/WordReportEditor.tsx', 'utf-8');
wp = wp.replace('`}  .hide-on-print { display: none !important; }\n          </style>', '.hide-on-print { display: none !important; }\n          `}</style>');
fs.writeFileSync('src/components/WordReportEditor.tsx', wp);
console.log('Fixed WordReportEditor.tsx');
