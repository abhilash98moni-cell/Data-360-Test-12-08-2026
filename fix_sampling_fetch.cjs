const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const replacement = `  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPopulations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          distributor: selectedDistributor !== 'All Distributors' ? selectedDistributor : 'Midwest Trading Co.',
          auditId: 'eng-101', // Ideally from props, using mock eng-101 as fallback
          auditPeriod: 'FY 2025-26', // From context
          status: 'ACCEPTED',
          documentUsage: 'SAMPLING_POPULATION'
        });

        const res = await fetch(\`/api/evidence?\${params.toString()}\`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          // Map to population format
          const pops = data.records.map((r: any) => ({
            id: r.id,
            fileName: r.fileName,
            type: r.requestTitle || 'Unknown Type',
            period: r.auditPeriod || 'FY 2025-26',
            records: r.fileSizeMB * 1000, // mock records
            value: r.fileSizeMB * 1000000, // mock value
            status: r.status,
            source: \`Data Request #\${r.requestRef}\`,
            uploadDate: r.uploadedDate,
            acceptedDate: r.reviewedDate || r.uploadedDate
          }));
          setAvailablePopulations(pops);
        } else {
          setAvailablePopulations([]);
        }
      } catch (err) {
        console.error("Failed to fetch populations", err);
        setAvailablePopulations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopulations();
  }, [selectedDistributor, selectedClient, currentUser]);`;

code = code.replace(/  useEffect\(\(\) => \{\n    \/\/ In a real app[\s\S]*?  \}, \[\]\);/, replacement);
fs.writeFileSync('src/components/SamplingView.tsx', code);
