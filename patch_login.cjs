const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const clientAuthCode = `
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const metadata = data.user.user_metadata || {};
        const rawRole = (metadata.role || 'Auditor').toLowerCase();
        const role = rawRole === 'admin' ? 'Admin' : rawRole === 'distributor' ? 'Distributor' : 'Auditor';
        const organization = metadata.organization || (role === 'Auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');
        
        const userSession = {
          id: data.user.id,
          email: data.user.email,
          role,
          organization,
          name: metadata.full_name || data.user.email?.split('@')[0] || 'User'
        };
        
        if (data.session) {
           localStorage.setItem('supabase.auth.token', data.session.access_token);
        }
        
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          onLogin(userSession);
        }, 500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed. Ensure your account has been approved by the Admin.');
      } finally {
        setIsSubmitting(false);
      }
`;

const oldAuthCode = `
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMessage('Logged in successfully!');
          setTimeout(() => {
            onLogin(data.user);
          }, 500);
        } else {
          setErrorMessage(data.error || 'Invalid email or password');
        }
      } catch (err: any) {
        setErrorMessage('Login failed. Ensure your account has been approved by the Admin.');
      } finally {
        setIsSubmitting(false);
      }
`;

if (code.includes(oldAuthCode.trim().split('\\n')[0])) {
   // do a replacement using regex or just replace the block.
   const blockStart = "const res = await fetch('/api/auth/login'";
   const blockRegex = /try \{\s+const res = await fetch\('\/api\/auth\/login'[\s\S]+?finally \{\s+setIsSubmitting\(false\);\s+\}\s+\}/;
   code = code.replace(blockRegex, clientAuthCode.trim());
   fs.writeFileSync('src/components/LoginPage.tsx', code);
   console.log('Patched LoginPage.tsx');
} else {
   console.log('Could not find old auth code');
}
