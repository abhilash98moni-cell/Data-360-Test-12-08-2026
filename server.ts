import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './src/app.js';

const getFilename = () => {
  try {
    return fileURLToPath(import.meta.url);
  } catch (err) {
    return process.cwd();
  }
};
const __filename = getFilename();
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`➜  Frontend:  http://localhost:${PORT}`);
    console.log(`➜  API:       http://localhost:${PORT}/api/health\n`);
  });
}

startServer();
