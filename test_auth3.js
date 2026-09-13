async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@midwest.com', password: 'demo' })
  });
  const loginData = await loginRes.json();
  const token = loginData.session.access_token;

  const syncRes = await fetch('http://localhost:3000/api/questionnaire/sync?client=Apex', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'x-user-role': 'Distributor',
      'x-user-org': 'Midwest Trading Co.'
    }
  });
  const syncData = await syncRes.json();
  console.log("Sync Response:", syncData);
}
run();
