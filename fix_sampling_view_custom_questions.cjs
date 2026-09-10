const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Update state to include scope
let stateTarget = `  const [questionBuilderForm, setQuestionBuilderForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    guidance: '',
    options: ['Option 1', 'Option 2'],
    conditionalRules: [] as any[]
  });`;

let stateReplacement = `  const [questionBuilderForm, setQuestionBuilderForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    scope: 'classification',
    guidance: '',
    options: ['Option 1', 'Option 2'],
    conditionalRules: [] as any[]
  });`;
if(code.includes(stateTarget)) code = code.replace(stateTarget, stateReplacement);

// Update fetchCustomQuestions
let fetchTarget = `        if (data.success && Array.isArray(data.questions)) {
          const formatted = data.questions.map((q: any) => ({
             id: q.question_id,
             text: q.question_text,
             contextClass: q.testing_classification,
             type: q.question_type,
             required: q.required,
             options: q.options,
             conditionalRules: q.conditional_rules,
             dbId: q.dbId
          }));
          setCustomQuestions(formatted);
        }`;
let fetchReplacement = `        if (data.success && Array.isArray(data.questions)) {
          const formatted = data.questions.map((q: any) => ({
             id: q.question_id,
             text: q.question_text,
             contextClass: q.testing_classification,
             type: q.question_type,
             required: q.required,
             options: q.options,
             conditionalRules: q.conditional_rules,
             dbId: q.dbId,
             attributeCode: q.attribute_code,
             scope: q.scope,
             sampleId: q.sample_id
          }));
          setCustomQuestions(formatted);
        }`;
if(code.includes(fetchTarget)) code = code.replace(fetchTarget, fetchReplacement);

// Update handleSaveCustomQuestion
let saveTarget = `  const handleSaveCustomQuestion = async () => {
     if (!questionBuilderForm.text.trim()) {
        alert("Question text is required.");
        return;
     }
     setIsSavingQuestion(true);
     try {
       const contextClass = reviewRecord?._activeClassificationContext || (reviewRecord && Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord?.testingClassification) || 'General';
       
       const payload = {
          question_id: 'CQ' + Date.now(),
          engagement_id: selectedAuditFilter || 'eng-101',
          testing_classification: contextClass,
          question_text: questionBuilderForm.text,
          question_type: questionBuilderForm.type,
          required: questionBuilderForm.required,
          options: questionBuilderForm.options,
          conditional_rules: questionBuilderForm.conditionalRules,
          display_order: customQuestions.length
       };
       
       const res = await fetch('/api/sampling/questions', {`;
let saveReplacement = `  const handleSaveCustomQuestion = async () => {
     if (!questionBuilderForm.text.trim()) {
        alert("Question text is required.");
        return;
     }
     setIsSavingQuestion(true);
     try {
       const contextClass = reviewRecord?._activeClassificationContext || (reviewRecord && Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord?.testingClassification) || 'General';
       
       // Calculate next attribute code
       const baseTemplate = TESTING_TEMPLATES[contextClass] || [];
       const existingClassQuestions = customQuestions.filter(q => q.contextClass === contextClass);
       
       // Find the highest letter
       let highestCharCode = 64; // Before 'A'
       for (const attr of baseTemplate) {
          if (attr.id && attr.id.length === 1) {
             const code = attr.id.charCodeAt(0);
             if (code > highestCharCode) highestCharCode = code;
          }
       }
       for (const attr of existingClassQuestions) {
          if (attr.attributeCode && attr.attributeCode.length === 1) {
             const code = attr.attributeCode.charCodeAt(0);
             if (code > highestCharCode) highestCharCode = code;
          }
       }
       const nextAttributeCode = String.fromCharCode(highestCharCode + 1);

       const payload = {
          question_id: 'CQ' + Date.now(),
          engagement_id: selectedAuditFilter || 'eng-101',
          testing_classification: contextClass,
          question_text: questionBuilderForm.text,
          question_type: questionBuilderForm.type,
          required: questionBuilderForm.required,
          scope: questionBuilderForm.scope,
          sample_id: questionBuilderForm.scope === 'sample' ? reviewRecord?.id : null,
          attribute_code: nextAttributeCode,
          options: questionBuilderForm.options,
          conditional_rules: questionBuilderForm.conditionalRules,
          display_order: customQuestions.length
       };
       
       const res = await fetch('/api/sampling/questions', {`;
if(code.includes(saveTarget)) code = code.replace(saveTarget, saveReplacement);

// Update saving append
let saveAppendTarget = `          setCustomQuestions(prev => [...prev, {
             id: payload.question_id,
             text: payload.question_text,
             contextClass: payload.testing_classification,
             type: payload.question_type,
             required: payload.required,
             options: payload.options,
             conditionalRules: payload.conditional_rules
          }]);
          setShowQuestionBuilder(false);
          setQuestionBuilderForm({
             text: '',
             type: 'Yes / No',
             required: false,
             guidance: '',
             options: ['Option 1', 'Option 2'],
             conditionalRules: []
          });`;
let saveAppendReplacement = `          setCustomQuestions(prev => [...prev, {
             id: payload.question_id,
             text: payload.question_text,
             contextClass: payload.testing_classification,
             type: payload.question_type,
             required: payload.required,
             options: payload.options,
             conditionalRules: payload.conditional_rules,
             attributeCode: payload.attribute_code,
             scope: payload.scope,
             sampleId: payload.sample_id
          }]);
          setShowQuestionBuilder(false);
          setQuestionBuilderForm({
             text: '',
             type: 'Yes / No',
             required: false,
             scope: 'classification',
             guidance: '',
             options: ['Option 1', 'Option 2'],
             conditionalRules: []
          });`;
if(code.includes(saveAppendTarget)) code = code.replace(saveAppendTarget, saveAppendReplacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Successfully updated custom question fetch and save handlers');
