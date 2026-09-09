const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const listenerCode = `
  // Sync Supabase Auth state with our app state
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('data360_active_user');
      } else if (event === 'SIGNED_IN' && session) {
        // If there's no currentUser, but we just signed in, it might be handled by LoginPage already,
        // but we can ensure they stay in sync. Let's not blindly overwrite currentUser if they just logged in,
        // because LoginPage builds the userSession object with role/organization.
      } else if (event === 'INITIAL_SESSION' && !session) {
         // If Supabase says absolutely no session on load, clear our local storage mock just in case
         setCurrentUser(null);
         localStorage.removeItem('data360_active_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
`;

if (!code.includes('onAuthStateChange')) {
  // We need to import supabase if not already imported
  if (!code.includes("import { supabase }")) {
    code = code.replace("import React,", "import { supabase } from './lib/supabaseClient';\nimport React,");
  }
  
  // Insert inside the component
  const target = "const [currentUser, setCurrentUser] = useState<UserSession | null>";
  code = code.replace(target, listenerCode + "\n  " + target);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Added auth listener to App.tsx');
}
