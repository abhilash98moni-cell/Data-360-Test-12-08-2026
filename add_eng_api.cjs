const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const engCode = `
import { getSupabaseServerClient } from './lib/supabaseServer.js';

app.get('/api/engagements', authenticateRequest, async (req, res) => {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'ENGAGEMENTS_STATE').order('created_at', { ascending: false }).limit(1);
  res.json({ success: true, engagements: data?.[0]?.details?.engagements || [] });
});

app.post('/api/engagements', authenticateRequest, async (req, res) => {
  const supabase = getSupabaseServerClient();
  const { engagements } = req.body;
  await supabase.from('system_audit_logs').insert({
    event_type: 'ENGAGEMENTS_STATE',
    target_user_email: req.auth?.email || 'system',
    details: { engagements }
  });
  res.json({ success: true });
});

`;

code = code.replace("export default app;", engCode + "\nexport default app;");
fs.writeFileSync('src/app.ts', code);
