const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf-8');

const newResolve = `
export async function resolveAuthSession(req: any): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  const sessionHeader = req.headers['x-session-token'] as string;
  const token = authHeader ? authHeader.replace(/^Bearer\\s+/i, '').trim() : (sessionHeader || '');

  if (token && serverUserSessions.has(token)) {
    return serverUserSessions.get(token)!;
  }

  const supabase = getSupabaseServerClient();

  if (token && token.length > 20 && !token.startsWith('sess_')) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        const metadata = data.user.user_metadata || {};
        const rawRole = (metadata.role || 'Auditor').toLowerCase();
        const role = rawRole === 'admin' ? 'Admin' : rawRole === 'distributor' ? 'Distributor' : 'Auditor';
        const organization = metadata.organization || (role === 'Auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');
        
        const authUser: AuthenticatedUser = {
          id: data.user.id,
          email: data.user.email || 'user@data360.io',
          role,
          organization,
          name: metadata.full_name || data.user.email?.split('@')[0] || 'User'
        };
        
        serverUserSessions.set(token, authUser);
        return authUser;
      } else if (error) {
         console.error('Supabase auth error:', error.message);
      }
    } catch (e) {
       console.error('Exception verifying Supabase token:', e);
    }
  }

  return null;
}
`;

const blockRegex = /export async function resolveAuthSession.*?return null;\n\}/s;
code = code.replace(blockRegex, newResolve.trim());
fs.writeFileSync('src/middleware/auth.ts', code);
