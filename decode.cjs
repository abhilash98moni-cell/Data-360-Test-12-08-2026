require('dotenv').config();
function decodeJwt(token) {
  if (!token) return 'missing';
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}
console.log("Anon Key:", decodeJwt(process.env.VITE_SUPABASE_ANON_KEY));
console.log("Service Key:", decodeJwt(process.env.SUPABASE_SERVICE_ROLE_KEY));
