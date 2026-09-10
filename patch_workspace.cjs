const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf-8');

code = code.replace(
    "import { DistributorSamplingReviewView } from './DistributorSamplingReviewView';",
    "import { SamplingView } from './SamplingView';"
);

code = code.replace(
    /<DistributorSamplingReviewView/g,
    "<SamplingView"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
console.log('EngagementWorkspaceView patched successfully');
