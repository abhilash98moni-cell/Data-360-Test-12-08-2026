const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

// Replace the login block to safely handle pending_signup_requests
const regexLogin = /try \{\s+const \{ data, error \} = await supabase.auth.signInWithPassword\([\s\S]+?finally \{\s+setIsSubmitting\(false\);\s+\}\s+\}/;

const newLogin = `
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          throw error;
        }

        if (!data.session || !data.user) {
          throw new Error('No valid session created.');
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
           throw new Error('Failed to establish session.');
        }

        try {
          const { data: pendingReq } = await supabase
            .from('pending_signup_requests')
            .select('status')
            .eq('email', email)
            .maybeSingle();
            
          if (pendingReq && pendingReq.status !== 'approved') {
            await supabase.auth.signOut();
            throw new Error('Your account is still pending admin approval.');
          }
        } catch (e) {
          // Ignore RLS errors or table missing errors
        }

        const metadata = data.user.user_metadata || {};
        const rawRole = (metadata.role || 'Auditor').toLowerCase();
        const finalRole = rawRole === 'admin' ? 'Admin' : rawRole === 'distributor' ? 'Distributor' : 'Auditor';
        
        localStorage.setItem('supabase.auth.token', data.session.access_token);

        const userSession: UserSession = {
          id: data.user.id,
          email: data.user.email || email,
          name: metadata.full_name || data.user.email?.split('@')[0] || 'User',
          role: finalRole,
          organization: metadata.organization || (finalRole === 'Auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.'),
          title: finalRole,
          avatarInitials: (metadata.full_name || email).substring(0, 2).toUpperCase()
        };

        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          onLogin(userSession);
        }, 500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed. Ensure your account has been approved.');
      } finally {
        setIsSubmitting(false);
      }
`;

if (code.match(regexLogin)) {
  code = code.replace(regexLogin, newLogin.trim());
  fs.writeFileSync('src/components/LoginPage.tsx', code);
  console.log('Safe login patched');
}
