const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const assignmentsFilter = `
  const filteredAssignments = assignments.filter(a => {
    const eng = engagements.find(e => e.id === a.engagementId);
    if (!eng) return false;
    const matchesClient = selectedClient === 'All Clients' || eng.clientName === selectedClient;
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      eng.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      eng.code.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });

  const filteredSamplingRuns = samplingRuns.filter(s => {
    const eng = engagements.find(e => e.id === s.engagementId);
    if (!eng) return false;
    const matchesClient = selectedClient === 'All Clients' || eng.clientName === selectedClient;
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      eng.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      eng.code.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });
`;

content = content.replace(/\/\/ Update Finding Status handler/, assignmentsFilter + '\n  // Update Finding Status handler');
content = content.replace(/samplingRuns={samplingRuns}/g, 'samplingRuns={filteredSamplingRuns}');
content = content.replace(/assignments={assignments}/g, 'assignments={filteredAssignments}');

fs.writeFileSync('src/App.tsx', content);
