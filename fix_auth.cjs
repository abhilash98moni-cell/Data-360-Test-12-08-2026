const fs = require('fs');

// 1. Update App.tsx to write cookies
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const appHookOld = `useEffect(() => {
    // Basic startup effect
    console.log('App started with role:', userRole);
  }, [userRole]);`;

const appHookNew = `useEffect(() => {
    // Basic startup effect
    console.log('App started with role:', userRole);
  }, [userRole]);

  // Synchronize currentUser state to a basic cookie for iframe API requests
  useEffect(() => {
    if (currentUser) {
      document.cookie = \`userRole=\${encodeURIComponent(currentUser.role)}; path=/\`;
      document.cookie = \`userOrg=\${encodeURIComponent(currentUser.organization || '')}; path=/\`;
    } else {
      document.cookie = \`userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\`;
      document.cookie = \`userOrg=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\`;
    }
  }, [currentUser]);
`;

if (appCode.includes(appHookOld)) {
  appCode = appCode.replace(appHookOld, appHookNew);
} else {
  // Try another place
  const mountOld = `const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });`;
  
  const mountNew = mountOld + `

  useEffect(() => {
    if (currentUser) {
      document.cookie = \`userRole=\${encodeURIComponent(currentUser.role)}; path=/\`;
      document.cookie = \`userOrg=\${encodeURIComponent(currentUser.organization || '')}; path=/\`;
    } else {
      document.cookie = \`userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\`;
      document.cookie = \`userOrg=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\`;
    }
  }, [currentUser]);`;
  
  appCode = appCode.replace(mountOld, mountNew);
}
fs.writeFileSync('src/App.tsx', appCode);

// 2. Update api/index.ts middleware to parse the cookies
let apiCode = fs.readFileSync('api/index.ts', 'utf8');
const middlewareOld = `function authenticateStorageRequest(req: any, res: any, next: any) {
  const role = req.headers['x-user-role'] || req.query.userRole || 'Auditor';
  const org = req.headers['x-user-organization'] || req.query.userOrg || '';
  req.auth = { role, organization: org };
  next();
}`;

const middlewareNew = `function authenticateStorageRequest(req: any, res: any, next: any) {
  let role = req.headers['x-user-role'] || req.query.userRole;
  let org = req.headers['x-user-organization'] || req.query.userOrg;
  
  if (!role || !org) {
    if (req.headers.cookie) {
      const cookies = Object.fromEntries(req.headers.cookie.split('; ').map((c: string) => c.split('=')));
      if (!role && cookies.userRole) role = decodeURIComponent(cookies.userRole);
      if (!org && cookies.userOrg) org = decodeURIComponent(cookies.userOrg);
    }
  }
  
  req.auth = { role: role || 'Auditor', organization: org || '' };
  next();
}`;

apiCode = apiCode.replace(middlewareOld, middlewareNew);
fs.writeFileSync('api/index.ts', apiCode);
