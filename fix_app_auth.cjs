const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    window.addEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);
    return () => window.removeEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);
  }, []);`;

const replacement = `    window.addEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);

    const handleAuthExpired = () => {
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('data360_active_user');
      setCurrentUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
console.log("Updated App.tsx");
