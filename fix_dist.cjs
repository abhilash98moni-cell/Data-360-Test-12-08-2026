const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /let realDistributorId = null;\s*try \{\s*const \{ data: distData \} = await supabase\s*\.from\('distributors'\)\s*\.select\('id'\)\s*\.eq\('entity_name', selectedDistributor\)\s*\.single\(\);\s*if \(distData\) realDistributorId = distData\.id;\s*\} catch \(e\) \{\s*console\.warn\("Could not fetch real distributor ID", e\);\s*\}/m;

const replacement = `let realDistributorId = null;
    try {
      const res = await fetch(\`/api/distributors?name=\${encodeURIComponent(selectedDistributor)}\`);
      if (res.ok) {
        const data = await res.json();
        if (data.distributors && data.distributors.length > 0) {
            realDistributorId = data.distributors[0].id;
        }
      }
    } catch (e) {
      console.warn("Could not fetch real distributor ID", e);
    }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated distributor fetch');
} else {
    console.log('Regex not found');
}
