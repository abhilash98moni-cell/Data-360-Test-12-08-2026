const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Let's find exactly the line numbers or indices
  const startStr = "app.post('/api/auth/signup-request'";
  const endStr = "app.post('/api/users/invite'";
  
  const startIndex = code.indexOf(startStr);
  const endIndex = code.indexOf(endStr);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error(`Could not find markers in ${filename}`);
    return;
  }
  
  const replacement = `app.post('/api/auth/signup-request', async (req, res) => {
    const { email, password, fullName, role, organization } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const cleanEmail = email.trim().toLowerCase();
    const formattedRole = (role || 'Auditor').toLowerCase();
    const validRole = formattedRole === 'admin' ? 'admin' : formattedRole === 'distributor' ? 'distributor' : 'auditor';
    const formattedOrg = organization || (validRole === 'auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');

    try {
      const client = getSupabaseServerClient();
      const { error } = await client.from('pending_signup_requests').insert({
        email: cleanEmail,
        full_name: fullName || cleanEmail.split('@')[0],
        role: validRole,
        organization: formattedOrg,
        status: 'pending'
      });
      if (error) return res.status(500).json({ success: false, error: error.message });
      
      await client.from('system_audit_logs').insert({
        event_type: 'SIGNUP_REQUEST_SUBMITTED',
        target_user_email: cleanEmail,
        details: { role: validRole, organization: formattedOrg }
      });

      return res.json({ success: true, message: 'Signup request submitted successfully and is awaiting admin approval.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/pending-signups', async (req, res) => {
    try {
      const client = getSupabaseServerClient();
      const { data: pendingRequests, error: pendingError } = await client
        .from('pending_signup_requests').select('*').eq('status', 'pending').order('requested_at', { ascending: false });
      if (pendingError) throw pendingError;

      const { count: approvedCount, error: approvedError } = await client
        .from('pending_signup_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      if (approvedError) throw approvedError;

      const { count: rejectedCount, error: rejectedError } = await client
        .from('pending_signup_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
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

  app.post('/api/admin/approve-signup', async (req, res) => {
    const { requestId, tempPassword } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    try {
      const client = getSupabaseServerClient();
      const { data: request, error: fetchError } = await client.from('pending_signup_requests').select('*').eq('id', requestId).single();
      if (fetchError || !request) return res.status(404).json({ error: 'Signup request not found' });

      const { data: authData, error: authError } = await client.auth.admin.createUser({
        email: request.email,
        password: tempPassword || 'Welcome123!',
        email_confirm: true,
        user_metadata: { full_name: request.full_name, role: request.role, organization: request.organization }
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

  app.post('/api/admin/reject-signup', async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    try {
      const client = getSupabaseServerClient();
      const { data: request, error: fetchError } = await client.from('pending_signup_requests').select('*').eq('id', requestId).single();
      if (fetchError || !request) return res.status(404).json({ error: 'Signup request not found' });

      await client.from('pending_signup_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', requestId);
      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_REJECT_USER', target_user_email: request.email,
        details: { role: request.role, organization: request.organization }
      });
      return res.json({ success: true, message: 'User rejected.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    try {
      const client = getSupabaseServerClient();
      
      const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        const { data: pending } = await client.from('pending_signup_requests').select('status').eq('email', email).limit(1).maybeSingle();
        if (pending && pending.status === 'pending') return res.status(401).json({ error: 'Account pending admin approval.' });
        return res.status(401).json({ error: 'Invalid credentials or unapproved account.' });
      }

      const { data: profile } = await client.from('profiles').select('*').eq('id', authData.user.id).limit(1).maybeSingle();
      
      const role = profile?.role || authData.user.user_metadata?.role || 'Auditor';
      const organization = profile?.organization || authData.user.user_metadata?.organization || 'Unknown Org';
      const fullName = profile?.full_name || authData.user.user_metadata?.full_name || email;

      const token = jwt.sign({ userId: authData.user.id, email, role, organization }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ success: true, token, user: { id: authData.user.id, email, fullName, role, organization } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  `;
  
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  
  // Make sure interfaces from previous blocks don't cause syntax errors if we accidentally wiped them.
  // Actually we didn't wipe interfaces.

  fs.writeFileSync(filename, code);
  console.log(`Replaced auth block completely in ${filename}`);
}

patch('server.ts');
patch('api/index.ts');
