const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const regexSignUp = /try \{\s+\/\/ Direct browser SDK insert into Supabase[\s\S]+?finally \{\s+setIsSubmitting\(false\);\s+\}\s+\}/;

const newSignUp = `
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, organization: org, full_name: fullName }
          }
        });
        
        if (error) {
          throw error;
        }

        // track in pending_signup_requests
        await supabase.from('pending_signup_requests').insert({
          email,
          password_hash: password,
          full_name: fullName || email.split('@')[0],
          role: role.toLowerCase(),
          organization: org,
          status: 'pending'
        });

        setSuccessMessage('Signup request registered! Pending Admin approval.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to submit signup request');
      } finally {
        setIsSubmitting(false);
      }
`;

const regexLogin = /try \{\s+const res = await fetch\('\/api\/auth\/login'[\s\S]+?finally \{\s+setIsSubmitting\(false\);\s+\}\s+\}/;

const newLogin = `
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          throw error;
        }

        if (!data.session || !data.user) {
          throw new Error('No valid session created.');
        }
        
        // Wait for session to be fully available
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
           throw new Error('Failed to establish session.');
        }

        // Check if user is approved (only if they are in pending_signup_requests)
        const { data: pendingReq } = await supabase
          .from('pending_signup_requests')
          .select('status')
          .eq('email', email)
          .maybeSingle();
          
        if (pendingReq && pendingReq.status !== 'approved') {
          await supabase.auth.signOut();
          throw new Error('Your account is still pending admin approval.');
        }

        const metadata = data.user.user_metadata || {};
        const rawRole = (metadata.role || 'Auditor').toLowerCase();
        const finalRole = rawRole === 'admin' ? 'Admin' : rawRole === 'distributor' ? 'Distributor' : 'Auditor';
        
        // Save token to localStorage for our fetch requests
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

code = code.replace(regexSignUp, newSignUp.trim());
code = code.replace(regexLogin, newLogin.trim());
fs.writeFileSync('src/components/LoginPage.tsx', code);
