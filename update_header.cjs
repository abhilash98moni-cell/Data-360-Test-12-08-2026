const fs = require('fs');

let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const targetUseEffect = `  useEffect(() => {
    if (currentUser?.role === 'Auditor') {
      setIsLoadingDistributors(true);
      setAuthError(null);
      const token = localStorage.getItem('supabase_token');
      if (!token) {
        setIsLoadingDistributors(false);
        setAuthError('Authentication required');
        return;
      }
      fetch('/api/users/me/distributors', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || \`HTTP \${res.status}: Failed to load authorized distributors\`);
        }
        return data;
      })
      .then(data => {
        if (Array.isArray(data.distributors)) {
          setAuthorizedDistributors(data.distributors);
          if (data.distributors.length > 0) {
            if (!data.distributors.includes(selectedDistributor)) {
              onDistributorChange(data.distributors[0]);
            }
          } else {
            onDistributorChange('');
          }
        }
      })
      .catch(err => {
        console.error('Distributor authorization lookup failed:', err);
        setAuthError(err.message || 'Authorization lookup failed');
        onDistributorChange('');
      })
      .finally(() => {
        setIsLoadingDistributors(false);
      });
    }
  }, [currentUser]);`;

const newUseEffect = `  // DEMO MODE:
  // Temporary distributor selector for client demonstration.
  // Replace with authenticated auditor_distributor_access flow
  // when multi-distributor authorization is re-enabled.
  const DEMO_DISTRIBUTORS = [
    'Midwest Trading Co.'
  ];

  useEffect(() => {
    if (currentUser?.role === 'Auditor') {
      setIsLoadingDistributors(true);
      setAuthError(null);
      
      // Simulate network delay for demo realism
      setTimeout(() => {
        const demoList = allDists.length > 0 ? allDists.map(d => d.name) : DEMO_DISTRIBUTORS;
        setAuthorizedDistributors(demoList);
        if (demoList.length > 0 && !demoList.includes(selectedDistributor)) {
          onDistributorChange(demoList[0]);
        }
        setIsLoadingDistributors(false);
      }, 300);
    }
  }, [currentUser, selectedDistributor, onDistributorChange, allDists]);`;

if (content.includes("fetch('/api/users/me/distributors'")) {
    content = content.replace(targetUseEffect, newUseEffect);
    fs.writeFileSync('src/components/Header.tsx', content);
    console.log("Successfully updated Header.tsx");
} else {
    console.log("Could not find the target useEffect in Header.tsx");
}
