const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const replacement = `
    const template = TESTING_TEMPLATES[getTemplateName(selectedPopulation)] || TESTING_TEMPLATES['3rd Party Disbursements'];
    
    // Validation: Require all attributes to be answered
    for (const attr of template) {
      if (!attributeAnswers[attr.id]?.result) {
        setValidationError(\`Please answer attribute \${attr.id} before saving.\`);
        setIsSaving(false);
        return;
      }
    }

    // Simulate DB save with detailed EXACT context payload
    const savePayload = {
      distributorId: selectedDistributor,
      engagementId: selectedAuditFilter,
      auditId: selectedAuditFilter,
      populationId: selectedPopulation.id,
      evidenceFileId: selectedPopulation.googleDriveFileId || selectedPopulation.id,
      transactionId: selectedTransaction.id,
      samplingPlanId: \`\${selectedPopulation.id}-plan\`,
      testingTemplateId: getTemplateName(selectedPopulation),
      auditorId: currentUser?.id || currentUser?.email,
      answers: attributeAnswers,
      timestamp: new Date().toISOString()
    };
    console.log("Saving testing results:", savePayload);
`;

code = code.replace(
  /const template = TESTING_TEMPLATES\[getTemplateName\(selectedPopulation\)\] \|\| TESTING_TEMPLATES\['3rd Party Disbursements'\];\s*\/\/ Validation: Require all attributes to be answered\s*for \(const attr of template\) \{\s*if \(\!attributeAnswers\[attr\.id\]\?\.result\) \{\s*setValidationError\(`Please answer attribute \$\{attr\.id\} before saving\.`\);\s*setIsSaving\(false\);\s*return;\s*\}\s*\}/,
  replacement
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
