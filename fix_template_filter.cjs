const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

let renderReviewTarget = `    const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
    const template = [...(TESTING_TEMPLATES[contextClass] || []), ...customQuestions.filter(q => q.contextClass === contextClass)];`;

let renderReviewReplacement = `    const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
    const relevantCustomQuestions = customQuestions.filter(q => 
       q.contextClass === contextClass && 
       (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
    );
    const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];`;
if(code.includes(renderReviewTarget)) {
    code = code.replace(renderReviewTarget, renderReviewReplacement);
}

let saveTarget = `       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
       const template = [...(TESTING_TEMPLATES[contextClass] || []), ...customQuestions.filter(q => q.contextClass === contextClass)];`;

let saveReplacement = `       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
       const relevantCustomQuestions = customQuestions.filter(q => 
          q.contextClass === contextClass && 
          (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
       );
       const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];`;
if(code.includes(saveTarget)) {
    code = code.replace(saveTarget, saveReplacement);
}

// Rendering the attribute letter
let attrLetterTarget = `<div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{attr.id}</div>`;
let attrLetterReplacement = `<div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{attr.attributeCode || attr.id}</div>`;
// Just do a global replace for this one if there are multiple, or just normal string replace
if(code.includes(attrLetterTarget)) code = code.replace(new RegExp(attrLetterTarget.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), attrLetterReplacement);


fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Successfully updated template filtering and rendering');
