const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const errStr = `    const token = req.headers.authorization?.split(' ')[1];
      const supabase = getSupabaseServerClient(token);

    // 2. Validate Supabase Auth token if standard JWT`;

const fixStr = `    const supabase = getSupabaseServerClient(token);

    // 2. Validate Supabase Auth token if standard JWT`;

content = content.replace(errStr, fixStr);
fs.writeFileSync('server.ts', content);
