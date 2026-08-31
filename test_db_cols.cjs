const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/test/cols',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Cols:', data); });
});
req.end();
