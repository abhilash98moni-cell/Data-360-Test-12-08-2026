fetch('http://localhost:3000/api/audits', {
  headers: {
    'Authorization': 'Bearer ' + 'sess_demo_xyz' // invalid token
  }
}).then(r => r.json()).then(console.log);
