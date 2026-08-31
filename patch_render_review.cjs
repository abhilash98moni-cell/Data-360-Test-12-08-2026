const fs = require('fs');

let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

code = code.replace(
    "      {renderReviewModal()}",
    "      {!isDistributor && renderReviewModal()}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
