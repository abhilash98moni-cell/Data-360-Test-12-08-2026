import fs from 'fs';
const path = 'src/components/SamplingView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(`                <div className="lg:col-span-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Balance</label>
                    <div className="text-sm">{getDisplayValue('balance', formatCurrency(selectedRecord.balance, currencyMode))}</div>
                </div>
            </div>
        </div>`, `                <div className="lg:col-span-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Balance</label>
                    <div className="text-sm">{getDisplayValue('balance', formatCurrency(selectedRecord.balance, currencyMode))}</div>
                </div>
            </div>
            </div>
        </div>`);

fs.writeFileSync(path, content, 'utf8');
