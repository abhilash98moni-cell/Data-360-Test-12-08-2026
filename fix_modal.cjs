const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

const strToRemove = `                            
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>Use for Sampling</span>
                            </button>
                          )}`;

code = code.replace(strToRemove, "");

// also remove `<button onClick={() => setSamplingModalRecord(item)}` if it exists.
// The code looks like:
//                          >
//                            <Download className="h-4 w-4" />
//                          </button>
//                           
//                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
//                            >
//                              <Layers className="h-3.5 w-3.5" />
//                              <span>Use for Sampling</span>
//                            </button>
//                          )}

const badBlock = code.substring(code.indexOf("<button") - 500, code.indexOf(")}", code.indexOf("Use for Sampling")) + 500);
// Let's just use string replacement carefully.
