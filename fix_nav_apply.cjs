const fs = require('fs');
let lines = fs.readFileSync('src/components/NavigationSidebar.tsx', 'utf8').split('\n');

lines[155] = '          )}';
lines[164] = '          )}';
lines[184] = '            )}';
lines[292] = '                    )}';
lines[297] = '                    )}';
lines[328] = '                  )}';
lines[330] = '              )}';
lines[372] = '        )}';
lines[407] = '        )}';

fs.writeFileSync('src/components/NavigationSidebar.tsx', lines.join('\n'));
console.log('Fixed syntax errors');
