const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Reporting: Generate Document (DOCX / PDF)`;
const replacement = `  // ====================================================================
  // Reports API (CRUD)
  // ====================================================================
  app.get('/api/reports', authenticateRequest, async (req: any, res: any) => {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase.from('audit_reports').select('*').order('created_at', { ascending: false });
      
      const role = req.headers['x-user-role'] || '';
      const org = req.headers['x-user-organization'] || '';
      
      if (role === 'Distributor' || role.includes('Distributor')) {
        query = query.eq('status', 'FINAL').eq('distributor_name', org || req.query.distributor);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      res.json({ success: true, reports: data });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/reports', express.json(), authenticateRequest, async (req: any, res: any) => {
    try {
      const supabase = getSupabaseServerClient();
      const report = req.body;
      const { error } = await supabase.from('audit_reports').insert([report]);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/reports/:id', express.json(), authenticateRequest, async (req: any, res: any) => {
    try {
      const supabase = getSupabaseServerClient();
      const updates = req.body;
      const { id } = req.params;
      const { error } = await supabase.from('audit_reports').update(updates).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/reports/:id', authenticateRequest, async (req: any, res: any) => {
    try {
      const supabase = getSupabaseServerClient();
      const { id } = req.params;
      const { error } = await supabase.from('audit_reports').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reporting: Generate Document (DOCX / PDF)`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Added /api/reports endpoints');
} else {
  console.log('Target not found in server.ts');
}
