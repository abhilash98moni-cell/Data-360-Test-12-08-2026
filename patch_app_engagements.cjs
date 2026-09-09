const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf8');

// Replace ENGAGEMENTS_STATE logic
const engGetRegex = /app\.get\('\/api\/engagements'[\s\S]*?res\.json\(\{ success: true, engagements: data\?\.\[0\]\?\.details\?\.engagements \|\| \[\] \}\);\n\}\);/g;
const newEngGet = `app.get('/api/engagements', authenticateRequest, async (req, res) => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('engagements').select('*');
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, engagements: data || [] });
});`;

const engPostRegex = /app\.post\('\/api\/engagements'[\s\S]*?res\.json\(\{ success: true \}\);\n\}\);/g;
const newEngPost = `app.post('/api/engagements', authenticateRequest, async (req: any, res: any) => {
  const supabase = getSupabaseServerClient();
  const { engagements } = req.body;
  
  if (Array.isArray(engagements)) {
    for (const eng of engagements) {
      await supabase.from('engagements').upsert({
        audit_id: eng.audit_id || eng.id,
        client_name: eng.client_name || eng.clientName,
        distributor_name: eng.distributor_name || eng.distributorName,
        status: eng.status || 'Planning',
        updated_at: new Date().toISOString()
      }, { onConflict: 'audit_id' });
    }
  }
  res.json({ success: true });
});`;

code = code.replace(engGetRegex, newEngGet);
code = code.replace(engPostRegex, newEngPost);
fs.writeFileSync('src/app.ts', code);
