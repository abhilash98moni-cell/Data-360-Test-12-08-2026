const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const approveEndpoint = `
app.post('/api/admin/approve-signup', authenticateRequest, async (req, res) => {
  try {
    if (req.auth?.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }
    
    const { requestId } = req.body;
    const supabase = getSupabaseServerClient();
    
    const { data: request, error: reqError } = await supabase
      .from('pending_signup_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (reqError || !request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await supabase.from('pending_signup_requests').update({ status: 'approved' }).eq('id', requestId);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;

code = code.replace("app.get('/api/supabase/health'", approveEndpoint + "\napp.get('/api/supabase/health'");
fs.writeFileSync('src/app.ts', code);
