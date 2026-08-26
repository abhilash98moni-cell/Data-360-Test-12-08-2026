const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInsert = `      const { error } = await supabase.from('system_audit_logs').insert({
         id: newResult.id,
         event_type: 'SAMPLING_TEST_RESULT',
         actor: req.auth.email || 'system',
         target_distributor: distributorId,
         details: newResult
      });`;

const newInsert = `      const { error } = await supabase.from('system_audit_logs').insert({
         event_type: 'SAMPLING_TEST_RESULT',
         target_user_email: \`\${newResult.clientName}::\${distributorId}\`,
         details: newResult,
         created_at: new Date().toISOString()
      });`;

code = code.replace(oldInsert, newInsert);
fs.writeFileSync('server.ts', code);
