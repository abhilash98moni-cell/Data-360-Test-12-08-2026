const fs = require('fs');

let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// Find the TD starting with "Application Controlled Fields"
// It looks like:
/*
                {/* Application Controlled Fields *\/}
                <td className="py-2 px-4 bg-slate-900/40 relative">
                  <button 
*/

code = code.replace(
    /\{\/\* Application Controlled Fields \*\/\}\s*<td className="py-2 px-4 bg-slate-900\/40 relative">([\s\S]*?)<\/td>/,
    `{!isDistributor && (
                <td className="py-2 px-4 bg-slate-900/40 relative">
$1
                </td>
                )}`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
