const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Remove the arrays
  code = code.replace(/const pendingSignupRequests:\s*PendingSignupRequest\[\]\s*=\s*\[\];\n?/g, '');
  code = code.replace(/const approvedUsersList:\s*any\[\]\s*=\s*\[\];\n?/g, '');
  code = code.replace(/let rejectedRequestsCount\s*=\s*0;\n?/g, '');

  // Let's find the exact endpoints and replace them
  // We'll use a crude but effective string split/replace method since regexes can be tricky with large blocks

  // Replace /api/auth/signup-request
  const signupStart = code.indexOf("app.post('/api/auth/signup-request', async (req, res) => {");
  const getPendingStart = code.indexOf("app.get('/api/admin/pending-signups', async (req, res) => {");
  if (signupStart !== -1 && getPendingStart !== -1 && getPendingStart > signupStart) {
    const replacement = `app.post('/api/auth/signup-request', async (req, res) => {
    const { email, fullName, role, organization } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedRole = (role || 'Auditor').toLowerCase();
    const validRole = formattedRole === 'admin' ? 'admin' : formattedRole === 'distributor' ? 'distributor' : 'auditor';
    const formattedOrg = organization || (validRole === 'auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');

    try {
      const client = getSupabaseServerClient();
      
      const { data, error } = await client.from('pending_signup_requests').insert({
        email: cleanEmail,
        full_name: fullName || cleanEmail.split('@')[0],
        role: validRole,
        organization: formattedOrg,
        status: 'pending'
      });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      await client.from('system_audit_logs').insert({
        event_type: 'SIGNUP_REQUEST_SUBMITTED',
        target_user_email: cleanEmail,
        details: { role: validRole, organization: formattedOrg }
      });

      return res.json({
        success: true,
        message: 'Signup request submitted successfully and is awaiting admin approval.'
      });
    } catch (dbErr: any) {
      return res.status(500).json({ success: false, error: dbErr.message });
    }
  });

  // Endpoint: Get Pending Signup Requests (Queries Supabase \`pending_signup_requests\` Table Directly)
  `;
    code = code.substring(0, signupStart) + replacement + code.substring(getPendingStart + "  // Endpoint: Get Pending Signup Requests (Queries Supabase `pending_signup_requests` Table Directly)\n  ".length);
  }

  // Reload positions after modification
  const getPendingStartNew = code.indexOf("app.get('/api/admin/pending-signups', async (req, res) => {");
  const approveStart = code.indexOf("app.post('/api/admin/approve-signup', async (req, res) => {");
  
  if (getPendingStartNew !== -1 && approveStart !== -1 && approveStart > getPendingStartNew) {
    const replacement = `app.get('/api/admin/pending-signups', async (req, res) => {
    try {
      const client = getSupabaseServerClient();
      
      // Fetch pending requests
      const { data: pendingRequests, error: pendingError } = await client
        .from('pending_signup_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch approved count
      const { count: approvedCount, error: approvedError } = await client
        .from('pending_signup_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
        
      if (approvedError) throw approvedError;

      // Fetch rejected count
      const { count: rejectedCount, error: rejectedError } = await client
        .from('pending_signup_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');
        
      if (rejectedError) throw rejectedError;

      return res.json({
        success: true,
        pendingRequests: pendingRequests || [],
        totalPending: pendingRequests?.length || 0,
        approvedCount: approvedCount || 0,
        rejectedCount: rejectedCount || 0
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint: Admin Approve Signup Request (Updates DB)
  `;
    code = code.substring(0, getPendingStartNew) + replacement + code.substring(approveStart);
  }

  // Approve Endpoint
  const approveStartNew = code.indexOf("app.post('/api/admin/approve-signup', async (req, res) => {");
  const rejectStart = code.indexOf("app.post('/api/admin/reject-signup', async (req, res) => {");

  if (approveStartNew !== -1 && rejectStart !== -1 && rejectStart > approveStartNew) {
    const replacement = `app.post('/api/admin/approve-signup', async (req, res) => {
    const { requestId, tempPassword } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    try {
      const client = getSupabaseServerClient();
      
      const { data: request, error: fetchError } = await client
        .from('pending_signup_requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (fetchError || !request) return res.status(404).json({ error: 'Signup request not found' });

      // Create user in Auth
      const { data: authData, error: authError } = await client.auth.admin.createUser({
        email: request.email,
        password: tempPassword || 'Welcome123!', // Admin must provide a temp password or use a secure default
        email_confirm: true,
        user_metadata: {
          full_name: request.full_name,
          role: request.role,
          organization: request.organization
        }
      });
      
      if (authError && !authError.message.includes('already exists')) {
         return res.status(500).json({ error: 'Failed to create Auth user: ' + authError.message });
      }

      await client.from('pending_signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId);
      
      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_APPROVE_USER', target_user_email: request.email,
        details: { role: request.role, organization: request.organization }
      });

      return res.json({ success: true, message: 'User approved and auth account created.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Endpoint: Admin Reject Signup Request (Updates DB & Discards Request)
  `;
    code = code.substring(0, approveStartNew) + replacement + code.substring(rejectStart);
  }

  const rejectStartNew = code.indexOf("app.post('/api/admin/reject-signup', async (req, res) => {");
  const loginStart = code.indexOf("app.post('/api/auth/login', async (req, res) => {");

  if (rejectStartNew !== -1 && loginStart !== -1 && loginStart > rejectStartNew) {
    const replacement = `app.post('/api/admin/reject-signup', async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    try {
      const client = getSupabaseServerClient();
      const { data: request, error: fetchError } = await client
        .from('pending_signup_requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (fetchError || !request) return res.status(404).json({ error: 'Signup request not found' });

      await client.from('pending_signup_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
        
      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_REJECT_USER', target_user_email: request.email,
        details: { role: request.role, organization: request.organization }
      });
      return res.json({ success: true, message: 'User rejected.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ====================================================================
  // 6. LOGIN ENDPOINT (Supabase Auth Authoritative)
  // ====================================================================
  `;
    code = code.substring(0, rejectStartNew) + replacement + code.substring(loginStart - 171); // Rough estimate to drop old comments
  }

  // Now replace Login entirely. Need to find where it ends.
  const loginStartNew = code.indexOf("app.post('/api/auth/login', async (req, res) => {");
  const verifyStart = code.indexOf("app.get('/api/auth/verify', async (req, res) => {");
  
  if (loginStartNew !== -1 && verifyStart !== -1) {
    const replacement = `app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    try {
      const client = getSupabaseServerClient();
      
      // We rely completely on Supabase Auth.
      // We do not check passwords against pending_signup_requests.
      // If the user hasn't been approved and created via Auth, signInWithPassword will fail.
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email, password
      });

      if (authError || !authData.user) {
        // If signIn fails, we check if they are pending to provide a better message
        const { data: pending } = await client.from('pending_signup_requests').select('status').eq('email', email).single();
        if (pending && pending.status === 'pending') {
           return res.status(401).json({ error: 'Account pending admin approval.' });
        }
        return res.status(401).json({ error: 'Invalid credentials or unapproved account.' });
      }

      // Fetch Profile
      const { data: profile } = await client.from('profiles').select('*').eq('id', authData.user.id).single();
      
      const role = profile?.role || authData.user.user_metadata?.role || 'auditor';
      const organization = profile?.organization || authData.user.user_metadata?.organization || 'Unknown Org';
      const fullName = profile?.full_name || authData.user.user_metadata?.full_name || email;

      const token = jwt.sign({ 
        userId: authData.user.id, 
        email, 
        role, 
        organization 
      }, JWT_SECRET, { expiresIn: '8h' });

      return res.json({
        success: true,
        token,
        user: { id: authData.user.id, email, fullName, role, organization }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Verify Session Token Endpoint
  `;
    code = code.substring(0, loginStartNew) + replacement + code.substring(verifyStart);
  }

  // Also replace old PendingSignupRequest type occurrences if any, wait, it's fine.

  fs.writeFileSync(filename, code);
  console.log(`Patched auth flow in ${filename}`);
}

patch('server.ts');
patch('api/index.ts');
