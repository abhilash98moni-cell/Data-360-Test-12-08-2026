const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');
const blockRegex = /const endpoints = \[\s*[\s\S]*?\];\s*endpoints\.forEach\(ep => \{\s*if \(ep\.includes\('\*'\)\) \{ \s*const base = ep\.replace\('\/\*', ''\); \s*app\.all\(base \+ '\/:id', async \(req, res\) => \{ res\.json\(\{ success: true, data: \[\], message: "Endpoint consolidated into unified router architecture\." \}\); \}\);\s*\} else \{ \s*app\.all\(ep, async \(req, res\) => \{ res\.json\(\{ success: true, data: \[\], message: "Endpoint consolidated into unified router architecture\." \}\); \}\);\s*\}\s*\}\);/g;
if (code.match(blockRegex)) {
  code = code.replace(blockRegex, "");
  fs.writeFileSync('src/app.ts', code);
  console.log("Removed endpoints array");
} else {
  console.log("Not found");
}
