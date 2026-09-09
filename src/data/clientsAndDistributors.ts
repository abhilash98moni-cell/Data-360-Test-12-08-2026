export interface DistributorInfo {
  id: string;
  name: string;
  code: string;
  region: string;
  status: 'Active Audit' | 'Planning' | 'Submitted' | 'Under Review';
}

export interface ClientTenantInfo {
  id: string;
  name: string;
  industry: string;
  distributors: DistributorInfo[];
}

export const SINGLE_AUDITOR_PRACTICE = {
  id: 'aud-practice-1',
  name: 'Apex Audit Practice (AA)',
  lead: 'Sarah Jenkins',
  type: 'External Audit Firm'
};

export const BASE_CLIENT_TENANTS: ClientTenantInfo[] = [
  {
    id: 'client-1',
    name: 'Apex Electronics Corp',
    industry: 'Consumer Technology',
    distributors: [
      { id: 'dist-1', name: 'Midwest Trading Co.', code: 'MDT-8092', region: 'Midwest Region (USA)', status: 'Active Audit' },
      { id: 'dist-2', name: 'Horizon Logistics India', code: 'HLI-4022', region: 'South Asia / India', status: 'Active Audit' },
      { id: 'dist-3', name: 'Pacific Rim Distribution', code: 'PRD-7712', region: 'Asia-Pacific (APAC)', status: 'Under Review' },
      { id: 'dist-4', name: 'Nexus Logistics Ltd', code: 'NEX-1044', region: 'Western Division', status: 'Submitted' },
      { id: 'dist-5', name: 'Middle East Company', code: 'MEC-5521', region: 'Middle East & Africa (MEA)', status: 'Planning' },
      { id: 'dist-6', name: 'EuroTech Supply Chains', code: 'ETS-3091', region: 'European Union (EU)', status: 'Planning' },
      { id: 'dist-7', name: 'LatAm Trading Network', code: 'LTN-9910', region: 'Latin America (LATAM)', status: 'Planning' }
    ]
  }
];

export const CLIENT_TENANTS: ClientTenantInfo[] = [...BASE_CLIENT_TENANTS];

// Hydrate stored clients and distributors from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('data360_custom_tenants');
    if (stored) {
      const parsed: ClientTenantInfo[] = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(pClient => {
          const existing = CLIENT_TENANTS.find(c => c.name.toLowerCase() === pClient.name.toLowerCase());
          if (existing) {
            (pClient.distributors || []).forEach(pDist => {
              if (!existing.distributors.some(d => d.name.toLowerCase() === pDist.name.toLowerCase())) {
                existing.distributors.push(pDist);
              }
            });
          } else {
            CLIENT_TENANTS.push(pClient);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Could not hydrate custom tenants from localStorage', e);
  }
}

export function saveTenantsToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('data360_custom_tenants', JSON.stringify(CLIENT_TENANTS));
  } catch (e) {
    console.warn('Failed to persist tenants to localStorage', e);
  }
}

export function registerNewDistributor(
  clientName: string,
  distributor: Partial<DistributorInfo> & { name: string }
): DistributorInfo {
  const normClient = clientName || 'Apex Electronics Corp';
  let client = CLIENT_TENANTS.find(c => c.name.toLowerCase() === normClient.toLowerCase());
  
  if (!client) {
    client = {
      id: `client-${Date.now()}`,
      name: normClient,
      industry: 'Enterprise Technology & Distribution',
      distributors: []
    };
    CLIENT_TENANTS.push(client);
  }

  const existingDist = client.distributors.find(d => d.name.toLowerCase() === distributor.name.toLowerCase());
  if (existingDist) {
    return existingDist;
  }

  const newDist: DistributorInfo = {
    id: distributor.id || `dist-${Date.now()}`,
    name: distributor.name.trim(),
    code: distributor.code || `${distributor.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    region: distributor.region || 'General Region',
    status: distributor.status || 'Planning'
  };

  client.distributors.push(newDist);
  saveTenantsToStorage();
  return newDist;
}

export function getDistributorsForClient(clientName: string): DistributorInfo[] {
  if (!clientName || clientName === 'All Clients') {
    return CLIENT_TENANTS[0]?.distributors || [];
  }
  const client = CLIENT_TENANTS.find(c => c.name.toLowerCase() === clientName.toLowerCase());
  return client ? client.distributors : (CLIENT_TENANTS[0]?.distributors || []);
}

export function getAllRegisteredDistributors(): DistributorInfo[] {
  const seen = new Set<string>();
  const all: DistributorInfo[] = [];
  CLIENT_TENANTS.forEach(c => {
    c.distributors.forEach(d => {
      if (!seen.has(d.name.toLowerCase())) {
        seen.add(d.name.toLowerCase());
        all.push(d);
      }
    });
  });
  return all;
}


