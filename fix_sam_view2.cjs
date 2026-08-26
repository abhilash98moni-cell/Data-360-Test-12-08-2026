const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  /\{filteredPopulations\.map\(\(pop, idx\) => \(\s*<tr key=\{pop\.id \|\| `pop-\$\{idx\}`\}/,
  "{filteredPopulations.map((pop, idx) => (\n<tr key={`pop-${idx}`}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
