const fs = require('fs');

const healthHandlerCode = `async (req, res) => {
  const startTime = Date.now();
  try {
    const supabase = getSupabaseServerClient();
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    const errors = [];
    const results = {};

    const checkTable = async (table) => {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          results[table] = { status: 'error', error: error.message, code: error.code };
          errors.push(table + ": " + error.message);
        } else {
          results[table] = { status: 'ok' };
        }
      } catch (err) {
        results[table] = { status: 'error', error: err.message };
        errors.push(table + ": " + err.message);
      }
    };

    await Promise.all([
      checkTable('pending_signup_requests'),
      checkTable('profiles'),
      checkTable('evidence_files')
    ]);

    const latencyMs = Date.now() - startTime;

    if (errors.length > 0) {
      return res.status(502).json({
        connected: false,
        error: 'Database query errors occurred. ' + errors.join(' | '),
        details: errors,
        tables: results,
        latencyMs,
        url: url
      });
    }

    return res.json({
      connected: true,
      latencyMs,
      url: url,
      tables: results,
      message: 'Successfully connected and verified all required tables!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      error: err.message || 'Failed to ping Supabase database',
      latencyMs: Date.now() - startTime
    });
  }
}`;

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/app\.get\('\/api\/supabase\/health',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?\}\s*\);/m, "app.get('/api/supabase/health', " + healthHandlerCode + ");");
fs.writeFileSync('server.ts', serverCode);

let apiCode = fs.readFileSync('api/index.ts', 'utf8');
apiCode = apiCode.replace(/app\.get\('\/api\/supabase\/health',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?\}\s*\);/m, "app.get('/api/supabase/health', " + healthHandlerCode + ");");
fs.writeFileSync('api/index.ts', apiCode);

