const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  /<div className="flex gap-3">\n\s*<button/s,
  "<div className=\"flex gap-3\">\n          {!saveSuccess ? (\n            <button"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
