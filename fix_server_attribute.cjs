const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPost = `      // Calculate the next attribute code for this classification
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
      
      const { error } = await supabase.from('system_audit_logs').insert({`;

const replacementPost = `      // Calculate the next attribute code if not provided
      let finalAttributeCode = payload.attribute_code;
      if (!finalAttributeCode) {
        const { data: existingQuestionsData } = await supabase
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'CUSTOM_TESTING_QUESTION');
          
        let existingCustomQuestions = (existingQuestionsData || [])
          .map(row => row.details)
          .filter(q => q.testing_classification === payload.testing_classification && q.engagement_id === payload.engagement_id);
          
        let highestCharCode = 64 + 12; // Base templates go up to L (which is 12th letter) for some, we should ideally know the max. We will rely on the client passing the current max.
        // Actually, let's use the one passed from the client, since the client computed it correctly. Wait, if client computed it based on active, it might reuse.
        // Let's compute highest based on existingCustomQuestions in DB (which includes deleted ones!)
        for (const q of existingCustomQuestions) {
          if (q.attribute_code && q.attribute_code.length === 1) {
             const code = q.attribute_code.charCodeAt(0);
             if (code > highestCharCode) highestCharCode = code;
          }
        }
        
        // Ensure it's at least greater than the client's suggestion to avoid conflicts
        if (payload.attribute_code && payload.attribute_code.length === 1) {
           const clientCode = payload.attribute_code.charCodeAt(0);
           if (highestCharCode < clientCode - 1) {
              highestCharCode = clientCode - 1;
           }
        }
        
        finalAttributeCode = String.fromCharCode(highestCharCode + 1);
      }
      
      const { error } = await supabase.from('system_audit_logs').insert({`;

if (code.includes(targetPost)) {
    code = code.replace(targetPost, replacementPost);
    // Also replace the attribute_code payload insertion
    code = code.replace(`attribute_code: payload.attribute_code, // E.g., 'M'`, `attribute_code: finalAttributeCode, // E.g., 'M'`);
    code = code.replace(`res.json({ success: true, attribute_code: payload.attribute_code });`, `res.json({ success: true, attribute_code: finalAttributeCode });`);
    fs.writeFileSync('server.ts', code);
    console.log('Successfully updated server to compute max attribute code');
} else {
    console.log('Target not found in server');
}
