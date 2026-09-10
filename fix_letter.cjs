const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const targetLetter = `{attr.id.startsWith('CQ') ? 'Q' : attr.id}`;
const replacementLetter = `{attr.attributeCode || attr.id}`;

if(code.includes(targetLetter)) {
    code = code.replace(targetLetter, replacementLetter);
    fs.writeFileSync('src/components/SamplingView.tsx', code);
    console.log('Successfully updated letter logic');
} else {
    console.log('Target letter logic not found');
}
