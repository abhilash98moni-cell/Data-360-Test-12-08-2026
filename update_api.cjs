const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

// Add uploadedById extraction
code = code.replace(
  "uploadedBy = req.headers['x-user-name'] || 'User',",
  "uploadedBy = req.headers['x-user-name'] || 'User',\n      uploadedById = req.headers['x-user-id'] || req.body.uploadedById,"
);

code = code.replace(
  "uploadedBy,\n        isReferenceMaterial: isRef",
  "uploadedBy,\n        uploadedById,\n        isReferenceMaterial: isRef"
);

fs.writeFileSync('api/index.ts', code);
