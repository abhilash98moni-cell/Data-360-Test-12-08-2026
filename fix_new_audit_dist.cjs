const fs = require('fs');
let content = fs.readFileSync('src/components/NewAuditModal.tsx', 'utf8');

// Inject selectedDistributor logic
const propsSearch = '  isOpen: boolean;';
const propsReplace = '  isOpen: boolean;\n  selectedDistributor?: string;';
content = content.replace(propsSearch, propsReplace);

const initSearch = 'export const NewAuditModal: React.FC<NewAuditModalProps> = ({';
const initReplace = 'export const NewAuditModal: React.FC<NewAuditModalProps> = ({ selectedDistributor, ';
content = content.replace(initSearch, initReplace);

const stateSearch = "  const [distributorName, setDistributorName] = useState('');";
const stateReplace = "  const [distributorName, setDistributorName] = useState(selectedDistributor && selectedDistributor !== 'All Distributors' && selectedDistributor !== 'No Distributors Assigned' ? selectedDistributor : '');";
content = content.replace(stateSearch, stateReplace);

const effSearch = '  useEffect(() => {';
const effReplace = `  useEffect(() => {
    if (isOpen && selectedDistributor && selectedDistributor !== 'All Distributors' && selectedDistributor !== 'No Distributors Assigned') {
      setDistributorName(selectedDistributor);
    }`;
content = content.replace(effSearch, effReplace);

fs.writeFileSync('src/components/NewAuditModal.tsx', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/onClose=\{.*setIsNewAuditOpen\(false\)\}/g, "onClose={() => setIsNewAuditOpen(false)} selectedDistributor={selectedDistributor}");
fs.writeFileSync('src/App.tsx', appContent);
