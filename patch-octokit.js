const fs = require('fs');
const path = require('path');

function patchDir(dir) {
  if (dir && !fs.existsSync(dir)) return;
  if (dir) {
    fs.readdirSync(dir).filter(f => f.includes('createOctokit')).forEach(f => {
      const fp = path.join(dir, f);
      console.log('Processing:', fp);
      let code = fs.readFileSync(fp, 'utf8');
      const orig = code;
      // De() — match up to the function-return closing parentheses )}
      // Looser match: look for ',De=()=>{...' up to the first occurrence of ')}'
      // where Se({...}) ends. The pattern: De=()=>{...return new Se({...})}
      code = code.replace(
        /De=\(\)=>\{.*?return new Se\(\{[^}]+\}\)\}/g,
        'De=()=>{return new Se({baseUrl:Ue,userAgent:Ce})}'
      );
      // Le() — match from 'Le=e=>{' to the first occurrence of '})' that ends it
      code = code.replace(
        /Le=e=>\{[^}]+Bad credentials[^}]+console\.log\(e\.message\)[^}]*\}/g,
        'Le=e=>{console.log("API error:",e.message)}'
      );
      if (code !== orig) {
        fs.writeFileSync(fp, code, 'utf8');
        console.log('  Patched');
      } else {
        console.log('  No match');
      }
    });
  }
}

// We need to find the export dir dynamically
const exportDir = 'site/status-page/__sapper__/export';
if (fs.existsSync(exportDir)) {
  const clients = fs.readdirSync(exportDir).filter(d => d.startsWith('client'));
  clients.forEach(d => patchDir(path.join(exportDir, d)));
} else {
  console.log('Export dir not found:', exportDir);
  // fallback: try known paths
  patchDir('site/status-page/__sapper__/export/client');
  patchDir('site/status-page/__sapper__/export/client/legacy');
}
console.log('Done.');
