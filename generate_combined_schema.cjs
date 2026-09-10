const fs = require('fs');

let schema1 = fs.readFileSync('supabase_schema.sql', 'utf8');

// I previously appended to supabase_schema.sql, let's reset it by getting from git
// wait, the applet environment doesn't necessarily have git history available.
