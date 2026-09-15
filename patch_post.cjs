const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Strict matching on existing record for this specific transaction[\s\S]*?let existingRecord = existing\?\.find\(d => \{[\s\S]*?const vNo = cleanStr\(parsed\?\.voucher_no \|\| parsed\?\.voucherNo \|\| ''\);[\s\S]*?return false;[\s\S]*?\}\);/g;

const newContent = `// Strict matching on existing record for this specific transaction
      const { data: existing } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'REQUIRED_DATA_RESP');
      
      let existingRecord = existing?.find(d => {
        let parsed = d.details;
        if (typeof parsed === 'string') {
           try { parsed = JSON.parse(parsed); } catch(e) {}
        }
        
        const recEngagement = cleanStr(parsed?.engagement_id || parsed?.engagementId || '');
        const recDistributor = cleanStr(parsed?.distributor_id || parsed?.distributorName || parsed?.distributor || '');
        
        if (targetEngagementId && targetEngagementId !== 'all audits' && recEngagement && recEngagement !== targetEngagementId) {
          return false;
        }
        if (targetDistributorId && targetDistributorId !== 'all distributors' && recDistributor && recDistributor !== targetDistributorId) {
          return false;
        }

        const rId = cleanStr(parsed?.row_id || parsed?.rowId || '');
        const sId = cleanStr(parsed?.sample_id || parsed?.sampleId || '');
        const vNo = cleanStr(parsed?.voucher_no || parsed?.voucherNo || '');
        
        if (targetRowId || targetSampleId || targetVoucherNo) {
          if (targetRowId && rId === targetRowId) return true;
          if (!targetRowId && targetSampleId && sId === targetSampleId) return true;
          if (!targetRowId && !targetSampleId && targetVoucherNo && vNo === targetVoucherNo) return true;
          return false;
        }
        
        return false;
      });`;

code = code.replace(regex, newContent);
fs.writeFileSync('server.ts', code);
