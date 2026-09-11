const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const sessionSearch = `  function authenticateRequestSession(req: express.Request) {
    const role = (req.body?.senderRole as string) || 'Auditor';
    const org =  (req.body?.senderOrganization as string) || 'Apex Audit Practice (AA)';
    const email =  (req.body?.senderEmail as string) || 'user@company.com';
    const name =  (req.body?.senderName as string) || 'Authorized User';`;

const sessionReplace = `  function authenticateRequestSession(req: any) {
    const role = req.auth?.role || 'Auditor';
    const org = req.auth?.organization || 'Apex Audit Practice (AA)';
    const email = req.auth?.email || 'user@company.com';
    const name = req.auth?.name || 'Authorized User';`;

content = content.replace(sessionSearch, sessionReplace);

content = content.replace(/app\.get\('\/api\/discussions\/conversations', async \(req, res\) => {/g, "app.get('/api/discussions/conversations', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.get\('\/api\/discussions\/messages', async \(req, res\) => {/g, "app.get('/api/discussions/messages', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.post\('\/api\/discussions\/post', async \(req, res\) => {/g, "app.post('/api/discussions/post', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.get\('\/api\/discussions\/participants', async \(req, res\) => {/g, "app.get('/api/discussions/participants', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.post\('\/api\/discussions\/participants\/add', async \(req, res\) => {/g, "app.post('/api/discussions/participants/add', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.post\('\/api\/discussions\/participants\/remove', async \(req, res\) => {/g, "app.post('/api/discussions/participants/remove', authenticateRequest, async (req: any, res: any) => {");
content = content.replace(/app\.post\('\/api\/discussions\/mark-read', async \(req, res\) => {/g, "app.post('/api/discussions/mark-read', authenticateRequest, async (req: any, res: any) => {");

// Also add token isolation to fetchMessagesFromSupabase
const fetchSearch = `  async function fetchMessagesFromSupabase(conversationId?: string): Promise<InStoreMessage[]> {
    const client = getSupabaseServerClient();`;

const fetchReplace = `  async function fetchMessagesFromSupabase(token: string | undefined, conversationId?: string): Promise<InStoreMessage[]> {
    const client = getSupabaseServerClient(token);`;

content = content.replace(fetchSearch, fetchReplace);

// Replace calls
content = content.replace(/fetchMessagesFromSupabase\(\)/g, "fetchMessagesFromSupabase(req.headers.authorization?.split(' ')[1])");
content = content.replace(/fetchMessagesFromSupabase\(expectedConvId\)/g, "fetchMessagesFromSupabase(req.headers.authorization?.split(' ')[1], expectedConvId)");
content = content.replace(/fetchMessagesFromSupabase\(conversationId\)/g, "fetchMessagesFromSupabase(req.headers.authorization?.split(' ')[1], conversationId)");
content = content.replace(/fetchMessagesFromSupabase\(convId\)/g, "fetchMessagesFromSupabase(req.headers.authorization?.split(' ')[1], convId)");

fs.writeFileSync('server.ts', content);
