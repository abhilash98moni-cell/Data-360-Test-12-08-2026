const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  "No files have been accepted as Sampling Population yet. The file must come through the existing Data Request workflow.",
  "No accepted sampling population has been submitted by this distributor for the selected audit period."
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
