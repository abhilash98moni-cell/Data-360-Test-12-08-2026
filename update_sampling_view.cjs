const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const regex = /\/\/ Simulate DB save with detailed EXACT context payload[\s\S]*?let outcome = 'Passed';\n    for \(const attr of template\) \{\n      const ans = attributeAnswers\[attr\.id\]\?\.result;\n      if \(ans === 'No'\) \{\n        outcome = 'Exception';\n        break; \/\/ If any No, it's an exception\n      \} else if \(ans === 'See Comments' && outcome !== 'Exception'\) \{\n        outcome = 'See Comments';\n      \}\n    \}/;

const replacement = `// Calculate Outcome
    let outcome = 'Passed';
    for (const attr of template) {
      const ans = attributeAnswers[attr.id]?.result;
      if (ans === 'No') {
        outcome = 'Exception';
        break; // If any No, it's an exception
      } else if (ans === 'See Comments' && outcome !== 'Exception') {
        outcome = 'See Comments';
      }
    }

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
      outcome,
      timestamp: new Date().toISOString()
    };
    console.log("Saving testing results:", savePayload);

    try {
      const res = await fetch('/api/sampling/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify(savePayload)
      });
      if (!res.ok) throw new Error('Failed to save to database');
    } catch(err) {
      console.error(err);
      setValidationError('Failed to save test result to the server.');
      setIsSaving(false);
      return;
    }`;

code = code.replace(regex, replacement);

// also remove the top `await new Promise(resolve => setTimeout(resolve, 600));`
code = code.replace('// Simulate DB save\n    await new Promise(resolve => setTimeout(resolve, 600));\n    \n    ', '');

fs.writeFileSync('src/components/SamplingView.tsx', code);
