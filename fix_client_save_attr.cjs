const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

let saveAppendTarget = `             conditionalRules: payload.conditional_rules,
             attributeCode: payload.attribute_code,
             scope: payload.scope,
             sampleId: payload.sample_id`;

let saveAppendReplacement = `             conditionalRules: payload.conditional_rules,
             attributeCode: data.attribute_code || payload.attribute_code,
             scope: payload.scope,
             sampleId: payload.sample_id,
             dbId: data.dbId || ''`;

if(code.includes(saveAppendTarget)) {
    code = code.replace(saveAppendTarget, saveAppendReplacement);
    fs.writeFileSync('src/components/SamplingView.tsx', code);
    console.log('Successfully updated response attribute mapping');
} else {
    console.log('Target not found in SamplingView.tsx');
}
