const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Fix line 154
  code = code.replace(/  \}\n\}\);\n  \}\n\}\);/m, "  }\n});");

  const startStr = "app.post('/api/auth/signup-request'";
  const endStr = "app.post('/api/users/invite'";
  
  const startIndex = code.indexOf(startStr);
  const endIndex = code.indexOf(endStr);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error(`Could not find markers in ${filename}`);
    return;
  }
  
  // We'll just read from server.ts instead!
  const serverCode = fs.readFileSync('server.ts', 'utf8');
  const serverStartIndex = serverCode.indexOf(startStr);
  const serverEndIndex = serverCode.indexOf(endStr);
  
  const authBlock = serverCode.substring(serverStartIndex, serverEndIndex);
  
  code = code.substring(0, startIndex) + authBlock + code.substring(endIndex);
  
  fs.writeFileSync(filename, code);
  console.log(`Replaced auth block completely in ${filename}`);
}

patch('api/index.ts');
