const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Add validation state
code = code.replace(
  "const [reviewComment, setReviewComment] = useState('');",
  "const [reviewComment, setReviewComment] = useState('');\n  const [validationError, setValidationError] = useState('');"
);

// Update save logic
code = code.replace(
  `  const handleSaveReview = () => {
    if (!selectedTransaction) return;

    if ((reviewOutcome === 'Exception Identified' || reviewOutcome === 'Major Exception') && !reviewComment) {
      alert("Auditor Comment is required for exceptions.");
      return;
    }`,
  `  const handleSaveReview = () => {
    if (!selectedTransaction) return;

    if ((reviewOutcome === 'Exception Identified' || reviewOutcome === 'Major Exception') && !reviewComment.trim()) {
      setValidationError("Auditor Comment/Description is required when logging an exception.");
      return;
    }
    setValidationError('');`
);

// Clear validation error on outcome change
code = code.replace(
  `setReviewOutcome(e.target.value)}`,
  `{ setReviewOutcome(e.target.value); setValidationError(''); }}`
);

// Add validation message to UI
code = code.replace(
  `</div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">`,
  `</div>
              )}
              
              {validationError && (
                <div className="p-3 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {validationError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Refined SamplingView.tsx validation');
