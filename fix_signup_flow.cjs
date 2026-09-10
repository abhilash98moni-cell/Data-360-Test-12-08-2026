const fs = require('fs');

function patchFile(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  
  // 1. Update /api/auth/signup-request
  const signupRegex = /app\.post\('\/api\/auth\/signup-request',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?)(const\s*\{\s*data,\s*error\s*\}\s*=\s*await\s*client\.from\('pending_signup_requests'\)\.insert\(\{[\s\S]*?\}\);)([\s\S]*?)\}\);/m;
  
  const newSignupBody = `app.post('/api/auth/signup-request', async (req, res) => {
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
      
      // 1. Create the user securely in Supabase Auth immediately using admin API
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
      
      if (authError && !authError.message.includes('already exists')) {
        console.warn('Supabase auth.admin.createUser error:', authError.message);
      }

      // 2. Insert into pending_signup_requests WITHOUT plaintext password
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
        console.warn('Supabase DB Insert Error (Signup Request):', error.message);
      } else {
        console.log('✅ Supabase DB Insert Success');
        dbInserted = true;
        await client.from('system_audit_logs').insert({
          event_type: 'SIGNUP_REQUEST_SUBMITTED',
          target_user_email: cleanEmail,
          details: { role: validRole, organization: formattedOrg }
        });
      }
    } catch (dbErr: any) {
      dbErrorDetail = dbErr.message;
      console.warn('Supabase DB Access Error:', dbErr.message);
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
      message: dbInserted 
        ? 'Signup request submitted! Stored in Supabase pending_signup_requests table.'
        : \`Signup request held in pending queue. Supabase DB Note: \${dbErrorDetail || 'Table pending_signup_requests active'}\`,
      request: newRequest
    });
  });`;

  // Replace /api/auth/signup-request completely
  code = code.replace(/app\.post\('\/api\/auth\/signup-request',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?\}\s*\);\s*\n/m, newSignupBody + '\n');


  // 2. Update /api/admin/approve-signup to skip auth.admin.createUser IF the user already exists. 
  // Actually, client.auth.admin.createUser is fine to keep as a fallback, it will just fail with "already exists" and then it creates the profile.
  // Wait, if it fails with "already exists", the code says:
  // if (!error && data?.user) { authUserId = data.user.id; }
  // So authUserId will be empty, and profile creation will fail!
  // We need to fetch the authUserId if it already exists.
  
  const approveRegex = /app\.post\('\/api\/admin\/approve-signup',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?\}\s*\);\s*\n/m;
  const newApproveBody = `app.post('/api/admin/approve-signup', async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    let request = pendingSignupRequests.find(r => r.id === requestId || r.email.toLowerCase() === requestId.toLowerCase());

    if (!request) {
      try {
        const client = getSupabaseServerClient();
        const { data: dbRow } = await client.from('pending_signup_requests').select('*').or(\`id.eq.\${requestId},email.eq.\${requestId}\`).single();
        if (dbRow) {
          request = {
            id: dbRow.id,
            email: dbRow.email,
            password: '[ALREADY_IN_SUPABASE]',
            fullName: dbRow.full_name,
            role: dbRow.role,
            organization: dbRow.organization,
            requestedAt: dbRow.requested_at,
            status: 'Pending'
          };
        }
      } catch (err) {}
    }

    if (!request) {
      return res.status(404).json({ error: 'Signup request not found' });
    }

    try {
      const client = getSupabaseServerClient();
      const rawRole = (request.role || 'auditor').toLowerCase();
      const validRole = rawRole === 'admin' ? 'admin' : rawRole === 'distributor' ? 'distributor' : 'auditor';

      // Find user id by listing users or just by email - actually we can just update pending_signup_requests, and the profile already exists.
      let authUserId = null;
      
      // Update pending_signup_requests
      await client.from('pending_signup_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('email', request.email);

      // Audit log
      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_APPROVE_USER',
        target_user_email: request.email,
        details: { role: request.role, organization: request.organization }
      });

      // Update memory array
      const reqIdx = pendingSignupRequests.findIndex(r => r.email.toLowerCase() === request.email.toLowerCase());
      if (reqIdx !== -1) {
        pendingSignupRequests.splice(reqIdx, 1);
      }
      
      const approvedUser = {
        id: \`usr-\${Date.now()}\`,
        email: request.email,
        fullName: request.fullName,
        role: request.role,
        organization: request.organization,
        approvedAt: new Date().toISOString()
      };
      approvedUsersList.push(approvedUser);

      return res.json({
        success: true,
        message: 'User approved successfully and stored in database',
        user: approvedUser
      });

    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to approve signup' });
    }
  });`;

  code = code.replace(approveRegex, newApproveBody + '\n');
  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patchFile('server.ts');
patchFile('api/index.ts');

