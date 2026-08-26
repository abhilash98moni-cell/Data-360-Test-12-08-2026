const fs = require('fs');

let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf8');

const regex1 = /interface EngagementWorkspaceViewProps \{\s*selectedClient: string;\s*selectedDistributor: string;\s*currentUser,\s*onFindingCreated: UserSession \| null;/g;
const replacement1 = `interface EngagementWorkspaceViewProps {
  selectedClient: string;
  selectedDistributor: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;`;
  
code = code.replace(regex1, replacement1);

const regex2 = /export const EngagementWorkspaceView: React\.FC<EngagementWorkspaceViewProps> = \(\{\s*selectedClient,\s*selectedDistributor,\s*currentUser,/g;
const replacement2 = `export const EngagementWorkspaceView: React.FC<EngagementWorkspaceViewProps> = ({
  selectedClient,
  selectedDistributor,
  currentUser,
  onFindingCreated,`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
