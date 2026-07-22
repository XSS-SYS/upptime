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
      const token = process.env.UPPTIME_TOKEN || '';
      if (token) {
        // Inject token into De() — replicate what Upptime does at build time
        code = code.replace(
          /De=\(\)=>\{[^}]+\}/,
          `De=()=>{return new Se({baseUrl:Ue,userAgent:Ce,auth:"${token}"})}`
        );
        // Replace Le() — log instead of redirect
        code = code.replace(
          /Le=e=>\{[^}]{10,}\}/,
          'Le=e=>{console.log("API error:",e.message)}'
        );
        console.log('  Token injected');
      } else {
        // Fallback: anonymous
        code = code.replace(
          /De=\(\)=>\{[^}]{10,}\}/,
          'De=()=>{return new Se({baseUrl:Ue,userAgent:Ce})}'
        );
        console.log('  Anonymous (no token)');
      }
      if (code !== orig) {
        fs.writeFileSync(fp, code, 'utf8');
        console.log('  Patched');
      } else {
        console.log('  No match');
      }
    });
  }
}

// Handle both modern and legacy dirs
const exportDir = 'site/status-page/__sapper__/export';
const dirs = [
  'client',
  'client/legacy'
];
dirs.forEach(d => patchDir(path.join(exportDir, d)));
console.log('Done.');
