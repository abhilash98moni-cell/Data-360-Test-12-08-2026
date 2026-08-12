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

export const CLIENT_TENANTS: ClientTenantInfo[] = [
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

export function getDistributorsForClient(clientName: string): DistributorInfo[] {
  // Always returns distributors under the single client Apex Electronics Corp
  return CLIENT_TENANTS[0].distributors;
}

