const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf8');

const evidenceRegex = /\/\/ Evidence Routes[\s\S]*?\/\/ Engagement Routes/g;

const newEvidence = `// Evidence Routes
app.get('/api/evidence', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('evidence_records').select('*');
    if (req.query.client && req.query.client !== 'All Clients') query = query.eq('client_name', req.query.client); // Assuming client_name exists, or we map it
    if (req.query.auditId && req.query.auditId !== 'All Audits') query = query.eq('audit_id', req.query.auditId);
    if (req.query.distributor && req.query.distributor !== 'All Distributors' && req.query.distributor !== 'all') {
       query = query.eq('distributor_name', req.query.distributor);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, records: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/evidence/:id/history', authenticateRequest, async (req, res) => {
  // Not fully implemented relationally yet, return empty for now
  res.json({ success: true, history: [] });
});

app.patch('/api/evidence/:id/usage', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('evidence_records').update({ status: req.body.usage }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/evidence/:id/review', authenticateRequest, async (req: any, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('evidence_records').update({
       status: req.body.status || 'Reviewed'
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Engagement Routes`;

code = code.replace(evidenceRegex, newEvidence);
fs.writeFileSync('src/app.ts', code);
