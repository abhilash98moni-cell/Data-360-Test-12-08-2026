fetch('http://localhost:3000/api/questionnaire/sync', {
  headers: {
    'Authorization': 'Bearer sess_demo_123',
    'x-user-role': 'Distributor',
    'x-user-org': 'Midwest Trading Co.'
  }
}).then(r => r.json()).then(console.log);
