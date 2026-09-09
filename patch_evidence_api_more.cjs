const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const moreApi = `
app.get('/api/evidence/:id/history', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'EVIDENCE_RECORD').eq('id', req.params.id);
    if (!data || data.length === 0) return res.json({ success: true, history: [] });
    res.json({ success: true, history: data[0].details?.history || [] });
  } catch (e) {
    res.json({ success: false, history: [] });
  }
});

app.patch('/api/evidence/:id/usage', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'EVIDENCE_RECORD').eq('id', req.params.id);
    if (!data || data.length === 0) return res.status(404).json({ success: false });
    
    let details = data[0].details || {};
    details.documentUsage = req.body.usage || req.body.documentUsage || details.documentUsage;
    
    await supabase.from('system_audit_logs').update({ details }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/evidence/:id/review', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'EVIDENCE_RECORD').eq('id', req.params.id);
    if (!data || data.length === 0) return res.status(404).json({ success: false });
    
    let details = data[0].details || {};
    details.status = req.body.status || details.status;
    details.reviewerComment = req.body.comment || details.reviewerComment;
    details.reviewedBy = req.auth?.name || 'Reviewer';
    details.reviewedDate = new Date().toISOString();
    
    await supabase.from('system_audit_logs').update({ details }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});
`;

code = code.replace("app.get('/api/health'", moreApi + "\napp.get('/api/health'");
fs.writeFileSync('src/app.ts', code);
