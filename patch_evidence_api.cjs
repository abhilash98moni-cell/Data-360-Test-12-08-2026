const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const evidenceApi = `
app.get('/api/evidence', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('system_audit_logs').select('*').eq('event_type', 'EVIDENCE_RECORD');
    
    if (req.query.client && req.query.client !== 'All Clients') {
      query = query.contains('details', { clientName: req.query.client });
    }
    if (req.query.auditId && req.query.auditId !== 'All Audits') {
      query = query.contains('details', { auditId: req.query.auditId });
    }
    if (req.query.distributor && req.query.distributor !== 'All Distributors' && req.query.distributor !== 'all') {
      query = query.contains('details', { distributorName: req.query.distributor });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const records = data.map(d => ({ id: d.id, ...d.details }));
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;

code = code.replace("app.get('/api/health'", evidenceApi + "\napp.get('/api/health'");
fs.writeFileSync('src/app.ts', code);
