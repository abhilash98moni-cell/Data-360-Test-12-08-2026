const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  /const template = TESTING_TEMPLATES\[getTemplateName\(selectedPopulation\)\] \|\| TESTING_TEMPLATES\['3rd Party Disbursements'\];/,
  "const template = TESTING_TEMPLATES[getTemplateName(selectedPopulation)] || TESTING_TEMPLATES['3rd Party Disbursements'];"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
