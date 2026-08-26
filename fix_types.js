import fs from 'fs';

const path = 'src/components/SamplingView.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `const [editedFields, setEditedFields] = useState<Record<string, { value: string, reason: string }>>({});`;
const replaceStr = `const [editedFields, setEditedFields] = useState<Record<string, { value: string, reason: string, isEditing?: boolean, tempValue?: string, tempReason?: string }>>({});`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(path, content, 'utf8');
