const fs = require('fs');
let code = fs.readFileSync('src/components/DistributorSamplingReviewView.tsx', 'utf8');

code = code.replace(
  "const mappedData = data.mappedData || targetFile.mappedData || {};\n        const mapping = typeof mappedData === 'string' ? JSON.parse(mappedData) : mappedData;",
  `const mappedData = data.mappedData || targetFile.mappedData || targetFile.glMapping || {};
        let mapping = {};
        if (typeof mappedData === 'string') {
          try {
            mapping = JSON.parse(mappedData);
          } catch(e) {
            console.error('Failed to parse mappedData:', mappedData, e);
          }
        } else {
          mapping = mappedData || {};
        }`
);

fs.writeFileSync('src/components/DistributorSamplingReviewView.tsx', code);
console.log('Fixed JSON.parse');
