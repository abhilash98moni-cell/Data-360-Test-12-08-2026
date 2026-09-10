const fs = require('fs');

function fix(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  code = code.replace(
    /  \/\/ Endpoint: Get Pending Signup Requests \(Queries Supabase `pending_signup_requests` Table Directly\)\n  verClient\(\);/m,
    `  // Endpoint: Get Pending Signup Requests (Queries Supabase \`pending_signup_requests\` Table Directly)
  app.get('/api/admin/pending-signups', async (req, res) => {
    try {
      const client = getSupabaseServerClient();`
  );

  code = code.replace(
    /  \/\/ Endpoint: Admin Reject Signup Request \(Updates DB & Discards Request\)\n  tId \} = req\.body;/m,
    `  // Endpoint: Admin Reject Signup Request (Updates DB & Discards Request)
  app.post('/api/admin/reject-signup', async (req, res) => {
    const { requestId } = req.body;`
  );

  fs.writeFileSync(filename, code);
  console.log(`Fixed chopped routes in ${filename}`);
}

fix('server.ts');
fix('api/index.ts');
