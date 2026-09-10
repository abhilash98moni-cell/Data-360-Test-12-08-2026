const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  const signupStart = code.indexOf("app.post('/api/auth/signup-request', async (req, res) => {");
  const signupEnd = code.indexOf("app.get('/api/admin/pending-signups'");
  
  if (signupStart !== -1 && signupEnd !== -1) {
    code = code.substring(0, signupStart) + 
`app.post('/api/auth/signup-request', async (req, res) => {
    const { email, password, fullName, role, organization } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedRole = (role || 'Auditor').toLowerCase();
    const validRole = formattedRole === 'admin' ? 'admin' : formattedRole === 'distributor' ? 'distributor' : 'auditor';
    const formattedOrg = organization || (validRole === 'auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');

    let dbInserted = false;
    let dbErrorDetail = null;

    try {
      const client = getSupabaseServerClient();
      
      const { data: authData, error: authError } = await client.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || cleanEmail.split('@')[0],
          role: validRole,
          organization: formattedOrg
        }
      });

      const { data, error } = await client.from('pending_signup_requests').insert({
        email: cleanEmail,
        password_hash: '[SECURELY_STORED_IN_SUPABASE_AUTH]',
        full_name: fullName || cleanEmail.split('@')[0],
        role: validRole,
        organization: formattedOrg,
        status: 'pending'
      });

      if (error) {
        dbErrorDetail = error.message;
      } else {
        dbInserted = true;
        await client.from('system_audit_logs').insert({
          event_type: 'SIGNUP_REQUEST_SUBMITTED',
          target_user_email: cleanEmail,
          details: { role: validRole, organization: formattedOrg }
        });
      }
    } catch (dbErr) {
      dbErrorDetail = dbErr.message;
    }

    const newRequest = {
      id: \`req-\${Date.now()}\`,
      email: cleanEmail,
      fullName: fullName || cleanEmail.split('@')[0],
      role: validRole,
      organization: formattedOrg,
      requestedAt: new Date().toISOString(),
      status: 'Pending'
    };

    pendingSignupRequests.push(newRequest);

    return res.json({
      success: true,
      dbInserted,
      dbError: dbErrorDetail,
      message: 'Signup request submitted!',
      request: newRequest
    });
  });

  // Endpoint: Get Pending Signup Requests (Queries Supabase \`pending_signup_requests\` Table Directly)
  ` + code.substring(signupEnd + "  // Endpoint: Get Pending Signup Requests (Queries Supabase `pending_signup_requests` Table Directly)\n  ".length);
  }

  const approveStart = code.indexOf("app.post('/api/admin/approve-signup'");
  const approveEnd = code.indexOf("app.post('/api/admin/reject-signup'");

  if (approveStart !== -1 && approveEnd !== -1) {
    code = code.substring(0, approveStart) +
`app.post('/api/admin/approve-signup', async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    let request = pendingSignupRequests.find(r => r.id === requestId || r.email.toLowerCase() === requestId.toLowerCase());

    if (!request) {
      try {
        const client = getSupabaseServerClient();
        const { data: dbRow } = await client.from('pending_signup_requests').select('*').or(\`id.eq.\${requestId},email.eq.\${requestId}\`).single();
        if (dbRow) {
          request = {
            id: dbRow.id, email: dbRow.email, password: '', fullName: dbRow.full_name,
            role: dbRow.role, organization: dbRow.organization, requestedAt: dbRow.requested_at, status: 'Pending'
          };
        }
      } catch (err) {}
    }

    if (!request) return res.status(404).json({ error: 'Signup request not found' });

    try {
      const client = getSupabaseServerClient();
      await client.from('pending_signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('email', request.email);
      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_APPROVE_USER', target_user_email: request.email,
        details: { role: request.role, organization: request.organization }
      });
      const reqIdx = pendingSignupRequests.findIndex(r => r.email.toLowerCase() === request.email.toLowerCase());
      if (reqIdx !== -1) pendingSignupRequests.splice(reqIdx, 1);
      
      const approvedUser = { id: \`usr-\${Date.now()}\`, email: request.email, fullName: request.fullName, role: request.role, organization: request.organization, approvedAt: new Date().toISOString() };
      approvedUsersList.push(approvedUser);

      return res.json({ success: true, message: 'User approved', user: approvedUser });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Endpoint: Admin Reject Signup Request (Updates DB & Discards Request)
  ` + code.substring(approveEnd + "  // Endpoint: Admin Reject Signup Request (Updates DB & Discards Request)\n  ".length);
  }

  fs.writeFileSync(filename, code);
  console.log(`Successfully wiped and replaced routes in ${filename}`);
}

patch('server.ts');
patch('api/index.ts');

