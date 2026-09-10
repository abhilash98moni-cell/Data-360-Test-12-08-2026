const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPost = `  // POST /api/sampling/questions
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
  });`;

const replacementPost = `  // POST /api/sampling/questions
  app.post('/api/sampling/questions', express.json(), authenticateRequest, async (req: any, res: any) => {
    try {
      const payload = req.body;
      const supabase = getSupabaseServerClient();
      
      // Calculate the next attribute code for this classification
      const { data: existingQuestionsData } = await supabase
        .from('system_audit_logs')
        .select('details')
        .eq('event_type', 'CUSTOM_TESTING_QUESTION');
        
      let existingCustomQuestions = (existingQuestionsData || [])
        .map(row => row.details)
        .filter(q => q.testing_classification === payload.testing_classification && q.engagement_id === payload.engagement_id);
        
      // Also we need to know the base template max letter, we'll pass it from client, 
      // or we can just look at existing custom questions and start from A and take the max letter.
      // Wait, the client knows the current max letter. Let's assume client passes attribute_code if it wants, OR server calculates.
      // Better yet, let the client calculate the next letter and pass it in payload.attribute_code.
      
      const { error } = await supabase.from('system_audit_logs').insert({
        event_type: 'CUSTOM_TESTING_QUESTION',
        action: 'CREATED_CUSTOM_QUESTION',
        user_email: req.user?.email || 'unknown',
        details: {
          question_id: payload.question_id || 'CQ' + Date.now(),
          engagement_id: payload.engagement_id,
          testing_classification: payload.testing_classification,
          sample_id: payload.sample_id || null, // NULL for 'classification' scope, specific ID for 'sample' scope
          scope: payload.scope || 'classification', // 'classification' or 'sample'
          attribute_code: payload.attribute_code, // E.g., 'M'
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
      res.json({ success: true, attribute_code: payload.attribute_code });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });`;

if (code.includes(targetPost)) {
    code = code.replace(targetPost, replacementPost);
    fs.writeFileSync('server.ts', code);
    console.log('Successfully updated POST questions API');
} else {
    console.log('Target post not found');
}
