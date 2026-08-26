import fs from 'fs';
const path = '/app/applet/src/components/SamplingView.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '              <tbody className="divide-y divide-slate-800">';
const endStr = '          </tbody>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const replaceStr = `              <tbody className="divide-y divide-slate-800">
                {filteredPopulations.map(pop => (
                  <tr key={pop.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-200">{pop.fileName}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{pop.type}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{pop.source}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{pop.uploadDate}</td>
                    <td className="py-3 px-4 text-sm">
                      <button 
                        onClick={() => handleSelectPopulation(pop)} 
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        Extract Transactions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>`;
  
  content = content.slice(0, startIndex) + replaceStr + content.slice(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Indices not found:", startIndex, endIndex);
}
