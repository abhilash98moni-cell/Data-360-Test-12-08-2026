const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Change from hidden 2xl:flex to flex (maybe hidden on very small mobile, but flex on lg/xl)
content = content.replace(/className="hidden 2xl:flex items-center gap-2/g, 'className="hidden lg:flex items-center gap-2');

fs.writeFileSync('src/components/Header.tsx', content);
