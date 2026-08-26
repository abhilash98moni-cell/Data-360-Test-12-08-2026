const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

const search = `    } finally {
      setIsAddingSampling(false);
    }
  };`;

const replace = `    } finally {
      setIsAddingSampling(false);
    }
  };

  const isSamplingAdded = selectedRecord?.samplingEnabled === true && selectedRecord?.samplingStatus === 'ADDED' && selectedRecord?.documentUsage?.includes('SAMPLING_POPULATION');

  const handleRemoveSampling = async () => {
    if (!removeSamplingModalRecord) return;
    setIsAddingSampling(true);
    try {
      const currentUsage = Array.isArray(removeSamplingModalRecord.documentUsage) ? removeSamplingModalRecord.documentUsage : 
                           (typeof removeSamplingModalRecord.documentUsage === 'string' ? removeSamplingModalRecord.documentUsage.split(',') : ['EVIDENCE']);
      const newUsage = currentUsage.filter((u) => u !== 'SAMPLING_POPULATION');
      const res = await fetch(\`/api/evidence/\${removeSamplingModalRecord.id}/usage\`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({ documentUsage: newUsage, samplingEnabled: false })
      });
      if (res.ok) {
        setToastMessage(\`✓ \${removeSamplingModalRecord.fileName} removed from Sampling.\`);
        setTimeout(() => setToastMessage(null), 4000);
        if (selectedRecord && selectedRecord.id === removeSamplingModalRecord.id) {
          setSelectedRecord({ ...selectedRecord, documentUsage: newUsage, samplingEnabled: false, samplingStatus: undefined });
        }
        setRemoveSamplingModalRecord(null);
        fetchEvidenceRecords();
      } else {
        setToastMessage(\`❌ Unable to remove document from Sampling. Please try again.\`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(\`❌ Unable to remove document from Sampling. Please try again.\`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAddingSampling(false);
    }
  };`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
