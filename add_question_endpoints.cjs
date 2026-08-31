const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  // GET /api/sampling/transactions`;
const replacementStr = `  // GET /api/sampling/questions
  app.get('/api/sampling/questions', authenticateRequest, async (req: any, res: any) => {
    try {
      const { distributorId, auditId } = req.query;
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'CUSTOM_TESTING_QUESTION');
      if (error) throw error;
      
      const questions = data
        .map(d => ({ dbId: d.id, ...d.details }))
        .filter(q => q.engagement_id === auditId);
        
      res.json({ success: true, questions });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/sampling/questions
  app.post('/api/sampling/questions', express.json(), authenticateRequest, async (req: any, res: any) => {
    try {
      const payload = req.body;
      const supabase = getSupabaseServerClient();
      
      const { error } = await supabase.from('system_audit_logs').insert({
        event_type: 'CUSTOM_TESTING_QUESTION',
        action: 'CREATED_CUSTOM_QUESTION',
        user_email: req.user?.email || 'unknown',
        details: {
          question_id: payload.question_id || 'CQ' + Date.now(),
          engagement_id: payload.engagement_id,
          testing_classification: payload.testing_classification,
          question_text: payload.question_text,
          question_type: payload.question_type,
          required: payload.required || false,
          options: payload.options || [],
          conditional_rules: payload.conditional_rules || {},
          display_order: payload.display_order || 0,
          created_by: req.user?.email || 'unknown',
          created_at: new Date().toISOString(),
          active: true
        }
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/sampling/questions/:id
  app.delete('/api/sampling/questions/:id', authenticateRequest, async (req: any, res: any) => {
    try {
      const { id } = req.params; // dbId
      const supabase = getSupabaseServerClient();
      // Soft delete by updating active=false inside details
      const { data: row, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr) throw fetchErr;
      if (row) {
         const newDetails = { ...row.details, active: false };
         const { error: updateErr } = await supabase.from('system_audit_logs').update({ details: newDetails }).eq('id', id);
         if (updateErr) throw updateErr;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/sampling/transactions`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('server.ts', code);
    console.log("Successfully added question endpoints");
} else {
    console.log("Could not find targetStr");
}
