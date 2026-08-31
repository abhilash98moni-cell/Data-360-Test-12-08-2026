const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPost = `      const { error } = await supabase.from('system_audit_logs').insert({
        event_type: 'CUSTOM_TESTING_QUESTION',
        action: 'CREATED_CUSTOM_QUESTION',
        user_email: req.user?.email || 'unknown',
        details: {
          question_id: payload.question_id || 'CQ' + Date.now(),
          engagement_id: payload.engagement_id,
          testing_classification: payload.testing_classification,
          sample_id: payload.sample_id || null, // NULL for 'classification' scope, specific ID for 'sample' scope
          scope: payload.scope || 'classification', // 'classification' or 'sample'
          attribute_code: finalAttributeCode, // E.g., 'M'
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
      res.json({ success: true, attribute_code: finalAttributeCode });`;

const replacementPost = `      const { data: insertedData, error } = await supabase.from('system_audit_logs').insert({
        event_type: 'CUSTOM_TESTING_QUESTION',
        action: 'CREATED_CUSTOM_QUESTION',
        user_email: req.user?.email || 'unknown',
        details: {
          question_id: payload.question_id || 'CQ' + Date.now(),
          engagement_id: payload.engagement_id,
          testing_classification: payload.testing_classification,
          sample_id: payload.sample_id || null, // NULL for 'classification' scope, specific ID for 'sample' scope
          scope: payload.scope || 'classification', // 'classification' or 'sample'
          attribute_code: finalAttributeCode, // E.g., 'M'
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
      }).select().single();
      if (error) throw error;
      res.json({ success: true, attribute_code: finalAttributeCode, dbId: insertedData?.id });`;

if (code.includes(targetPost)) {
    code = code.replace(targetPost, replacementPost);
    fs.writeFileSync('server.ts', code);
    console.log('Successfully updated server to return dbId');
} else {
    console.log('Target not found in server');
}
