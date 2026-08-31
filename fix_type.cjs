const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

const regex = /handleSaveCustomQuestion\(null,\s*newQ\);/;
if (regex.test(code)) {
    code = code.replace(regex, 'handleSaveCustomQuestion(undefined, newQ);');
    fs.writeFileSync('src/components/SamplingView.tsx', code);
    console.log('Fixed handleSaveCustomQuestion call');
} else {
    console.log('Could not find call to fix');
}
