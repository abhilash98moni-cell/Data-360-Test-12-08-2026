const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// Add customQuestions state
const stateSearch = `  const [searchQuery, setSearchQuery] = useState('');`;
const stateReplace = `  const [searchQuery, setSearchQuery] = useState('');
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);`;
if (code.includes(stateSearch)) {
    code = code.replace(stateSearch, stateReplace);
}

// Modify modal header
const headerSearch = `            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                  {reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification.join(', ') : reviewRecord.testingClassification)}
                </span>
                <span className="font-mono text-sm text-slate-400">{reviewRecord.testingReference}</span>
              </div>
              <h2 className="text-xl font-bold text-white">Sample Testing & Attributes</h2>
            </div>
            <button onClick={() => setReviewRecord(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">`;

const headerReplace = `            <div className="flex-1 pr-8">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                  {reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification.join(', ') : reviewRecord.testingClassification)}
                </span>
                <span className="font-mono text-sm text-slate-400">{reviewRecord.testingReference}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-white">Sample Testing & Attributes</h2>
                <button 
                  onClick={() => {
                     const text = prompt("Enter new attribute/question to test:");
                     if (text && text.trim()) {
                       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
                       setCustomQuestions(prev => [...prev, { id: 'CQ' + Math.floor(Math.random()*10000), text, contextClass }]);
                     }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
            </div>
            <button onClick={() => setReviewRecord(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0">`;

if (code.includes(headerSearch)) {
    code = code.replace(headerSearch, headerReplace);
} else {
    console.log("Could not find header search");
}

// Ensure custom questions render by merging with template
const templateSearch = `    const template = TESTING_TEMPLATES[contextClass] || [];`;
const templateReplace = `    const template = [...(TESTING_TEMPLATES[contextClass] || []), ...customQuestions.filter(q => q.contextClass === contextClass)];`;

if (code.includes(templateSearch)) {
    code = code.replace(templateSearch, templateReplace);
}

// Add Plus import if missing
if (!code.includes('Plus,')) {
    code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { Plus, $1 } from 'lucide-react';");
}

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Update complete');
