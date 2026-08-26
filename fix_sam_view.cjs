const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  /\{filteredPopulations\.map\(pop => \(\s*<tr key=\{pop\.id\}/,
  "{filteredPopulations.map((pop, idx) => (\n<tr key={pop.id || `pop-${idx}`}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
