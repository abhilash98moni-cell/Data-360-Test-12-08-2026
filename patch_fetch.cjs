const fs = require('fs');
const file = 'src/components/SamplingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
        const data = await res.json();
        console.log("SamplingView: Fetched raw records count:", data.records?.length || 0);
        if (data.success && Array.isArray(data.records)) {
          const filteredRecords = data.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptableStatus = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\\s+/g, '_'));
            const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');
            if (isTemplate) return false;
            
            const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
            console.log("File:", r.fileName, "samplingEnabled:", r.samplingEnabled, "usage:", usage, "hasSamplingUsage:", hasSamplingUsage, "status:", status, "isAcceptableStatus:", isAcceptableStatus);
            
            return r.samplingEnabled === true && hasSamplingUsage && isAcceptableStatus;
          });
          console.log("SamplingView: Filtered records count:", filteredRecords.length);
`;

code = code.replace(/const data = await res\.json\(\);\s*if \(data\.success && Array\.isArray\(data\.records\)\) \{\s*const filteredRecords = data\.records\.filter\(\(r: any\) => \{\s*const usage = r\.documentUsage \|\| '';\s*const status = r\.status \|\| '';\s*const isAcceptableStatus = \['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'\]\.includes\(status\.toUpperCase\(\)\.replace\(\/\\s\+\/g, '_'\)\);\s*const isTemplate = \(r\.fileName \|\| ''\)\.toLowerCase\(\)\.includes\('template'\) \|\| \(r\.fileName \|\| ''\)\.toLowerCase\(\)\.includes\('questionnaire'\);\s*if \(isTemplate\) return false;\s*return r\.samplingEnabled === true && usage\.includes\('SAMPLING_POPULATION'\) && isAcceptableStatus;\s*\}\);/, replacement);

fs.writeFileSync(file, code);
