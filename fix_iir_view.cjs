const fs = require('fs');
let code = fs.readFileSync('src/components/InitialInformationRequestView.tsx', 'utf8');

// There are a lot of map loops. Let's just fix the top level ones.
code = code.replace(
  /editRequestsList\.filter\(r => r\.status === 'PENDING'\)\.map\(\(req\) => \(\s*<div key=\{req\.id\}/,
  "editRequestsList.filter(r => r.status === 'PENDING').map((req, idx) => (\n<div key={`req-pend-${idx}`}"
);

code = code.replace(
  /editRequestsList\.filter\(r => r\.status !== 'PENDING'\)\.map\(\(req\) => \(\s*<div\s*key=\{req\.id\}/,
  "editRequestsList.filter(r => r.status !== 'PENDING').map((req, idx) => (\n<div key={`req-comp-${idx}`}"
);

code = code.replace(
  /requests\.filter\(r => r\.categoryNumber === cat\.num\)\.map\(\(item\) => \{[\s\S]*?return \(\s*<div key=\{item\.id\}/,
  (match) => match.replace("return (\n                        <div key={item.id}", "return (\n                        <div key={`item-${item.id}-${item.title}`}")
);

fs.writeFileSync('src/components/InitialInformationRequestView.tsx', code);
