const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  "  aiFlagged?: boolean;\n}",
  "  aiFlagged?: boolean;\n  distributorId?: string;\n  engagementId?: string;\n  auditPeriod?: string;\n  sourceFileId?: string;\n}"
);

code = code.replace(
  "const generateMockTransactions = (count: number): Transaction[] => {",
  "const generateMockTransactions = (count: number, context: {distributor: string, period: string, fileId: string}): Transaction[] => {"
);

code = code.replace(
  "      aiFlagged: isHighRisk && Math.random() > 0.5\n    };\n  });",
  "      aiFlagged: isHighRisk && Math.random() > 0.5,\n      distributorId: context.distributor,\n      engagementId: 'eng-101',\n      auditPeriod: context.period,\n      sourceFileId: context.fileId\n    };\n  });"
);

code = code.replace(
  "setTransactions(generateMockTransactions(sampleSize));",
  "setTransactions(generateMockTransactions(sampleSize, { distributor: selectedDistributor, period: selectedPopulation?.period || 'FY 2025-26', fileId: selectedPopulation?.id || '' }));"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
