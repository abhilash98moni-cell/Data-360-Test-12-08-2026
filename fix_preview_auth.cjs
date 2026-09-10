const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const oldPreview = `app.get('/api/storage/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloaded = await storageService.downloadFile(fileId);`;

const newPreview = `app.get('/api/storage/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    // Extract auth from headers or query params
    const authHeader = req.headers['authorization'];
    const token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;
    
    const downloaded = await storageService.downloadFile(fileId);`;

console.log(code.includes(oldPreview));
