const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `  app.post('/api/audits/create', (req, res) => {
    const auditData = req.body;`;
const replace = `  app.post('/api/audits/create', authenticateRequest, async (req: any, res: any) => {
    const auditData = req.body;
    
    // Auth Check
    if (req.auth.role === 'Auditor' && auditData.distributorName) {
      const token = req.headers.authorization?.split(' ')[1];
      const supabase = getSupabaseServerClient(token);
      const { data: allowed } = await supabase.from('auditor_distributor_access')
        .select('id')
        .eq('auditor_user_id', req.auth.id)
        .eq('distributor_name', auditData.distributorName)
        .eq('is_active', true)
        .maybeSingle();
      if (!allowed) return res.status(403).json({ error: 'Access Denied: You are not authorized for this distributor.' });
    }
`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
