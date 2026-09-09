const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const clientSignUpCode = `
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { role, organization: org, full_name: fullName }
          }
        });
        
        if (authError) {
          setErrorMessage(authError.message);
          setIsSubmitting(false);
          return;
        }

        // Also track the request in the pending table for the admin approval dashboard
        await supabase.from('pending_signup_requests').insert({
          email,
          full_name: fullName || email.split('@')[0],
          role: role.toLowerCase(),
          organization: org,
          status: 'pending' // Admin must approve this
        });

        // The user is created in Supabase Auth.
        // In many setups, they require email verification, but assuming it's auto-confirmed or we just wait for admin approval
        setSuccessMessage('Signup request registered! Pending Admin approval.');
      } catch (err: any) {
        setErrorMessage('Failed to submit signup request: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
`;

const blockRegex = /try \{\s+\/\/ Direct browser SDK insert into Supabase[\s\S]+?finally \{\s+setIsSubmitting\(false\);\s+\}\s+\}/;
if (code.match(blockRegex)) {
  code = code.replace(blockRegex, clientSignUpCode.trim());
  fs.writeFileSync('src/components/LoginPage.tsx', code);
  console.log('Patched signup in LoginPage.tsx');
} else {
  console.log('Regex failed');
}
