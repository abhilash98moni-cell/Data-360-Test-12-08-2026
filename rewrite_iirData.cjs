const fs = require('fs');

const content = fs.readFileSync('src/data/iirData.ts', 'utf8');

// I'll parse the file using simple string replacement or regex where possible. 
// Or I can just write a script to load it, filter it and write it back.
