const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sampling/questions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': 'test@example.com',
    'x-user-role': 'Auditor',
    'x-user-organization': 'Internal'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.write(JSON.stringify({
  engagement_id: 'eng-101',
  testing_classification: '3rd Party Disbursement',
  question_text: 'Test question?',
  question_type: 'Yes / No',
  required: true,
  scope: 'classification',
  sample_id: null,
  options: ['Yes', 'No'],
  conditional_rules: []
}));
req.end();
