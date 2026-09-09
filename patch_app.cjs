const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf8');

const catchAllRegex = /\/\/ GENERIC PERSISTENCE LAYER FOR ALL PROTOTYPE ENDPOINTS[\s\S]*?export default app;/;

const newCatchAll = `// Fallback for unimplemented endpoints to strictly prevent fake success responses
app.all('/api/*', authenticateRequest, (req, res) => {
  res.status(501).json({
    success: false,
    error: \`Endpoint not implemented: \${req.method} \${req.path}\`
  });
});

export default app;`;

code = code.replace(catchAllRegex, newCatchAll);
fs.writeFileSync('src/app.ts', code);
