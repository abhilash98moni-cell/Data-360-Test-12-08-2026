import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const script = `
    <script>
      window.addEventListener('error', function(e) {
        document.body.innerHTML += '<div style="color:red; background:black; padding:20px; z-index:9999; position:absolute; top:0; left:0; right:0; bottom:0; overflow:auto;"><h2>Error:</h2><pre>' + e.message + '\\n' + e.error?.stack + '</pre></div>';
      });
      window.addEventListener('unhandledrejection', function(e) {
        document.body.innerHTML += '<div style="color:red; background:black; padding:20px; z-index:9999; position:absolute; top:0; left:0; right:0; bottom:0; overflow:auto;"><h2>Unhandled Promise Rejection:</h2><pre>' + e.reason + '</pre></div>';
      });
    </script>
`;

html = html.replace('</head>', script + '</head>');
fs.writeFileSync('index.html', html);
console.log('patched index.html');
