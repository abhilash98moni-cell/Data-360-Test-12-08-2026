const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const loginCode = `
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Ensure user has been approved by checking pending_signup_requests
        const { data: requestStatus, error: reqError } = await supabase
           .from('pending_signup_requests')
           .select('status')
           .eq('email', email)
           .single();
           
        if (requestStatus && requestStatus.status !== 'approved') {
           // Reject login if pending
           setErrorMessage('Your account is still pending admin approval.');
           setIsSubmitting(false);
           // Sign them out of Supabase auth just in case
           await supabase.auth.signOut();
           return;
        }

        const metadata = data.user.user_metadata || {};
`;

const regex = /try \{\s+const \{ data, error \} = await supabase.auth.signInWithPassword\(\{ email, password \}\);\s+if \(error\) throw error;\s+const metadata = data\.user\.user_metadata \|\| \{\};/;
if (code.match(regex)) {
   code = code.replace(regex, loginCode.trim());
   fs.writeFileSync('src/components/LoginPage.tsx', code);
   console.log('Patched login check');
} else {
   console.log('Regex 2 failed');
}
