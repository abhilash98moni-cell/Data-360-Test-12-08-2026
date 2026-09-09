const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const healthEndpoint = `
app.get('/api/supabase/health', async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    
    const start = Date.now();
    const { error: dbError } = await supabase.from('pending_signup_requests').select('id').limit(1);
    const latencyMs = Date.now() - start;
    
    if (dbError) {
       return res.json({
         connected: true,
         latencyMs,
         error: 'Connection OK but table query failed: ' + dbError.message
       });
    }

    res.json({
      connected: true,
      latencyMs,
      message: 'Supabase connected successfully.'
    });
  } catch (err: any) {
    res.json({
      connected: false,
      error: err.message || 'Unable to connect to Supabase.'
    });
  }
});
`;

code = code.replace("app.get('/api/health'", healthEndpoint + "\napp.get('/api/health'");
code = code.replace("'/api/supabase/health', ", "");
code = code.replace("'/api/auth/login', ", "");
code = code.replace("'/api/auth/signup-request', ", "");
fs.writeFileSync('src/app.ts', code);
