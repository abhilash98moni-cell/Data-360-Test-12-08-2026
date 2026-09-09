const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

const controllerImports = `
import { 
  syncIrl, 
  submitIrl, 
  getEditRequests, 
  requestEdit, 
  approveEditRequest, 
  rejectEditRequest 
} from './controllers/irlController.js';
`;

code = code.replace("import { authenticateRequest } from \"./middleware/auth.js\";", "import { authenticateRequest } from \"./middleware/auth.js\";\n" + controllerImports);

// replace submitIrl
code = code.replace(/app\.post\('\/api\/iir\/submit', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.post('/api/iir/submit', authenticateRequest, submitIrl);");
code = code.replace(/app\.get\('\/api\/iir\/sync', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.get('/api/iir/sync', authenticateRequest, syncIrl);");
code = code.replace(/app\.get\('\/api\/iir\/edit-requests', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.get('/api/iir/edit-requests', authenticateRequest, getEditRequests);");
code = code.replace(/app\.post\('\/api\/iir\/request-edit', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.post('/api/iir/request-edit', authenticateRequest, requestEdit);");
code = code.replace(/app\.post\('\/api\/iir\/request-edit\/approve', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.post('/api/iir/request-edit/approve', authenticateRequest, approveEditRequest);");
code = code.replace(/app\.post\('\/api\/iir\/request-edit\/reject', async \(req, res\) => \{[\s\S]*?\}\);/m, "app.post('/api/iir/request-edit/reject', authenticateRequest, rejectEditRequest);");

fs.writeFileSync('src/app.ts', code);
