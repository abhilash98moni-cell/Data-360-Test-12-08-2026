const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexGet = /app\.get\('\/api\/sampling\/required-data\/responses', authenticateRequest, async \(req: any, res: any\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, error: err\.message \}\);\s*\}\s*\}\);/g;

const newGet = `app.get('/api/sampling/required-data/responses', authenticateRequest, async (req: any, res: any) => {
    try {
      const { sampleId, voucherNo, rowId, row_id, distributorId, auditId } = req.query;
      const supabase = getSupabaseServerClient();
      const cleanStr = (s: any) => String(s || '').trim().toLowerCase();
      const isValidKey = (s: any) => {
        const c = cleanStr(s);
        return c !== '' && c !== '—' && c !== '-' && c !== 'undefined' && c !== 'null' && c !== 'n/a';
      };
      
      let query = supabase.from('system_audit_logs').select('*').eq('event_type', 'REQUIRED_DATA_RESP');
      
      const { data, error } = await query;
      if (error) throw error;
      
      const targetEngagementId = cleanStr(auditId);
      const targetDistributorId = cleanStr(distributorId);
      const targetRowId = isValidKey(rowId || row_id) ? cleanStr(rowId || row_id) : '';
      const targetSampleId = isValidKey(sampleId) ? cleanStr(sampleId) : '';
      const targetVoucherNo = isValidKey(voucherNo) ? cleanStr(voucherNo) : '';

      const responses = (data || [])
        .map(d => {
           let parsed = d.details;
           if (typeof parsed === 'string') {
               try { parsed = JSON.parse(parsed); } catch(e) {}
           }
           return { dbId: d.id, ...parsed };
        })
        .filter(r => {
           const rAudit = cleanStr(r.engagement_id || r.engagementId || '');
           const rDist = cleanStr(r.distributor_id || r.distributorName || r.distributor || '');
           if (auditId && auditId !== 'All Audits' && rAudit && rAudit !== targetEngagementId) return false;
           if (distributorId && distributorId !== 'All Distributors' && rDist && rDist !== targetDistributorId) return false;
           
           if (targetRowId || targetSampleId || targetVoucherNo) {
             const sId = cleanStr(r.sample_id || r.sampleId || '');
             const vNo = cleanStr(r.voucher_no || r.voucherNo || '');
             const rId = cleanStr(r.row_id || r.rowId || '');
             
             if (targetRowId && rId === targetRowId) return true;
             if (!targetRowId && targetSampleId && sId === targetSampleId) return true;
             if (!targetRowId && !targetSampleId && targetVoucherNo && vNo === targetVoucherNo) return true;
             return false;
           }
           return true;
        });
        
      res.json({ success: true, responses });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });`;

code = code.replace(regexGet, newGet);

const postRegex = /app\.post\('\/api\/sampling\/required-data\/responses', express\.json\(\), authenticateRequest, async \(req: any, res: any\) => \{[\s\S]*?const targetKeys = \[targetRowId, targetSampleId, targetVoucherNo\]\.filter\(isValidKey\);[\s\S]*?if \(targetKeys\.length > 0\) \{[\s\S]*?return targetKeys\.some\(k =>[\s\S]*?\(rId && rId === k\) \|\| \(sId && sId === k\) \|\| \(vNo && vNo === k\)[\s\S]*?\);[\s\S]*?\}[\s\S]*?return false;[\s\S]*?\}\);/g;

const newPostPart1 = `const targetKeys = [targetRowId, targetSampleId, targetVoucherNo].filter(isValidKey);`;
const newPostPart1Replace = `// keys replaced`;

const newPostPart2 = `if (targetKeys.length > 0) {
          return targetKeys.some(k => 
             (rId && rId === k) || (sId && sId === k) || (vNo && vNo === k)
          );
        }
                
        return false;
      });`;
const newPostPart2Replace = `if (targetRowId || targetSampleId || targetVoucherNo) {
          if (targetRowId && rId === targetRowId) return true;
          if (!targetRowId && targetSampleId && sId === targetSampleId) return true;
          if (!targetRowId && !targetSampleId && targetVoucherNo && vNo === targetVoucherNo) return true;
          return false;
        }
        return false;
      });`;

code = code.replace(newPostPart1, newPostPart1Replace).replace(newPostPart2, newPostPart2Replace);

fs.writeFileSync('server.ts', code);
console.log("Replaced GET endpoint");
