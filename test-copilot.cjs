const http = require('http');

const data = JSON.stringify({
  message: "Hi",
  context: {
    auditId: "eng-101",
    client: "Test Client",
    distributor: "Test Dist"
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/copilot/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-role': 'Auditor',
    'x-user-email': 'test@test.com',
    'x-user-name': 'Test User',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
