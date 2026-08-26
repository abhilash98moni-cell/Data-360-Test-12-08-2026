const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const replacement = `
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-800">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block mb-3">Overall Auditor Comment</label>
              <textarea
                value={attributeAnswers['overall']?.comment || ''}
                onChange={(e) => setAttributeAnswers(prev => ({
                  ...prev,
                  ['overall']: { result: 'N/A', comment: e.target.value }
                }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[120px]"
                placeholder="Add your overall conclusion or final observation for this transaction..."
              />
            </div>
          </div>
`;

code = code.replace(
  /              \}\)\}\n            <\/div>\n          <\/div>/,
  replacement
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
