const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sampling/questions?distributorId=test&auditId=eng-101',
  method: 'GET',
  headers: {
    'x-user-email': 'test@example.com',
    'x-user-role': 'Auditor'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.end();
