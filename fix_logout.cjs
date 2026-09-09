const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldLogout = `
  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('data360_active_user');
    }
  };
`;

const newLogout = `
  const handleLogout = async () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('data360_active_user');
    }
    await supabase.auth.signOut();
  };
`;

code = code.replace(oldLogout.trim(), newLogout.trim());
fs.writeFileSync('src/App.tsx', code);
