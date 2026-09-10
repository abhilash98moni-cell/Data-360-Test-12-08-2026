const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Find the POST /api/sampling/transactions route
// It starts with: app.post('/api/sampling/transactions', express.json(), authenticateRequest, async (req: any, res: any) => {

let targetCode = `      // Check if it already exists
      const { data: existing } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'GL_SAMPLE');
      const found = existing?.find(d => d.details.sampleId === sampleId && d.details.distributorId === distributorId && d.details.auditId === auditId);
      
      if (found) {
        // Enforce role-based permissions
        const userRole = req.headers['x-user-role'];
        let updatedDetails = { ...found.details, ...payload };
        
        if (userRole === 'Distributor') {
           // Prevent Distributor from modifying auditor-only testing fields
           updatedDetails.testingClassification = found.details.testingClassification;
           updatedDetails.testingStatus = found.details.testingStatus;
           updatedDetails.testingReference = found.details.testingReference;
        }

        // Update
        const { error } = await supabase.from('system_audit_logs').update({
          details: updatedDetails
        }).eq('id', found.id);`;

code = code.replace(
    /(\/\/ Check if it already exists[\s\S]*?\/\/\s*Update\s*const \{ error \} = await supabase.from\('system_audit_logs'\)\.update\(\{)\s*details: \{ \.\.\.found\.details, \.\.\.payload \}\s*(\}\)\.eq\('id', found\.id\);)/,
    targetCode
);

fs.writeFileSync('server.ts', code);
