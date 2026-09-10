const fs = require('fs');
let code = fs.readFileSync('src/components/RequiredDataQuestionnaire.tsx', 'utf8');

// The problematic section is:
// ) : (                                                    
// {(!isDistributor || isReviewMode) ? (
//   <div className="text-xs text-slate-500 italic">No document uploaded</div>
// ) : (

code = code.replace(
  /\) : \(\s*\{\(!isDistributor \|\| isReviewMode\) \? \(/,
  `) : (!isDistributor || isReviewMode) ? (`
);

// We have an extra closing brace `)}` at the end
code = code.replace(
  /                          \)\}\n                        \)\}\n                      <\/div>/,
  `                          )\n                        }\n                      </div>`
);

fs.writeFileSync('src/components/RequiredDataQuestionnaire.tsx', code);
