const fs = require('fs');

let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// The component function start looks something like:
// const SamplingView: React.FC<SamplingViewProps> = ({
//   currentUser,
//   selectedClient,
//   selectedDistributor,
//   selectedAuditFilter,
//   onFindingCreated
// }) => {

if (!code.includes('const isDistributor = currentUser?.role ===')) {
    code = code.replace(
        /(\s*)currentUser,([\s\S]*?)\) => \{/,
        `$1currentUser,$2) => {\n  const isDistributor = currentUser?.role === 'Distributor';`
    );
}

fs.writeFileSync('src/components/SamplingView.tsx', code);
