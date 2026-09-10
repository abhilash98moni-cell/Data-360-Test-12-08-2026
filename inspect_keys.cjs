require('dotenv').config();

function checkKey(name, key) {
  if (!key) {
    console.log(`${name} is NOT SET`);
    return;
  }
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log(`${name} is present. Role in JWT payload: ${payload.role}`);
    } catch (e) {
      console.log(`${name} is present but payload cannot be parsed.`);
    }
  } else {
    console.log(`${name} is present but not a valid JWT.`);
  }
}

checkKey('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
checkKey('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
