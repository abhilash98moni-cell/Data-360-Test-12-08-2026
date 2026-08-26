const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace(
  "{formatCurrency(selectedTransaction.amount, currencyMode)}",
  "{selectedTransaction.amount === null ? '—' : formatCurrency(selectedTransaction.amount, currencyMode)}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
