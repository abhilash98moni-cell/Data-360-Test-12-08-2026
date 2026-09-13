const fs = require('fs');
let content = fs.readFileSync('src/services/questionnaireApiClient.ts', 'utf8');

const helper = `
function getAuthHeaders(userRole?: string, userOrg?: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
  const headers: any = {
    ...(token ? { 'Authorization': \`Bearer \${token}\` } : {})
  };
  if (userRole) headers['x-user-role'] = userRole;
  if (userOrg) headers['x-user-org'] = userOrg;
  return headers;
}
`;

content = content.replace("export async function fetchQuestionnaireState", helper + "\nexport async function fetchQuestionnaireState");

// 1. fetchQuestionnaireState
content = content.replace(
`      headers: {
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      }`,
`      headers: getAuthHeaders(userRole, userOrg)`
);

// 2. saveQuestionnaireAnswers
content = content.replace(
`      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      }`,
`      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(userRole, userOrg)
      }`
);

// 3. submitQuestionnaire
content = content.replace(
`      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      }`,
`      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(userRole, userOrg)
      }`
);

// 4. saveQuestionnaireAuditorNotes
content = content.replace(
`      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
      }`,
`      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(userRole)
      }`
);

// 5. requestEditAccessQuestionnaire
content = content.replace(
`      headers: { 'Content-Type': 'application/json' },`,
`      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },`
);

// 6. reviewEditAccessQuestionnaire
content = content.replace(
`      headers: { 'Content-Type': 'application/json' },`,
`      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },`
);

// 7. customizeQuestionnaire
content = content.replace(
`      headers: { 'Content-Type': 'application/json' },`,
`      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },`
);

fs.writeFileSync('src/services/questionnaireApiClient.ts', content);
console.log("Updated questionnaireApiClient.ts");
