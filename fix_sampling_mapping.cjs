const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  "const mapping = targetFile.glMapping || {};",
  `let mapping = {};
        if (typeof targetFile.glMapping === 'string') {
           try { mapping = JSON.parse(targetFile.glMapping); } catch(e) {}
        } else if (typeof targetFile.mappedData === 'string') {
           try { mapping = JSON.parse(targetFile.mappedData); } catch(e) {}
        } else {
           mapping = targetFile.glMapping || targetFile.mappedData || {};
        }`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Fixed SamplingView mapping');
