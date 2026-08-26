const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const queryExtraction = `      const {
        client,
        auditId,
        distributor,
        status,
        search,
        documentUsage,
        auditPeriod
      } = req.query as Record<string, string>;`;

code = code.replace(/      const \{\n        client,\n        auditId,\n        distributor,\n        status,\n        search\n      \} = req.query as Record<string, string>;/, queryExtraction);

const mappingCode = `          aiRiskScore: r.ai_risk_score,
          aiExtractedData: r.ai_extracted_data,
          aiAnalysisTimestamp: r.ai_analysis_timestamp,
          documentUsage: r.document_usage || 'GENERAL_EVIDENCE',
          auditPeriod: r.audit_period || 'FY 2025-26'
        };`;

code = code.replace(/          aiRiskScore: r.ai_risk_score,\n          aiExtractedData: r.ai_extracted_data,\n          aiAnalysisTimestamp: r.ai_analysis_timestamp\n        \};\n/, mappingCode + '\n');

const filteringCode = `      if (status && status !== 'All') {
        const normStatus = status.toUpperCase().replace(/\\s+/g, '_');
        dbRecords = dbRecords.filter(r => r.status === normStatus || r.status.toUpperCase().replace(/\\s+/g, '_') === normStatus);
      }

      if (documentUsage) {
        dbRecords = dbRecords.filter(r => r.documentUsage === documentUsage);
      }
      
      if (auditPeriod) {
        dbRecords = dbRecords.filter(r => r.auditPeriod === auditPeriod);
      }`;

code = code.replace(/      if \(status && status !== 'All'\) \{\n        const normStatus = status.toUpperCase\(\).replace\(\/\\s\+\/g, '_'\);\n        dbRecords = dbRecords.filter\(r => r.status === normStatus\);\n      \}/, filteringCode);

fs.writeFileSync('server.ts', code);
