const fs = require('fs');
const path = require('path');

function patchDir(dir) {
  if (dir && !fs.existsSync(dir)) return;
  if (dir) {
    fs.readdirSync(dir).filter(f => f.includes('createOctokit') && f.endsWith('.js')).forEach(f => {
      const fp = path.join(dir, f);
      console.log('Processing:', fp);
      let code = fs.readFileSync(fp, 'utf8');
      const orig = code;
      const token = process.env.UPPTIME_TOKEN || '';

      // 1. Replace Le() — simple, no nested braces
      code = code.replace(
        /Le=e=>\{[^}]+(Bad credentials|rate limit)[^}]*\}/,
        'Le=e=>{console.log("API error:",e.message)}'
      );

      // 2. Replace De() using position-based depth counting
      const deMatch = code.match(/(De=\(\)=>\{)/);
      if (deMatch) {
        const start = deMatch.index + deMatch[0].length; // position after the opening {
        let depth = 1;
        let end = start;
        while (depth > 0 && end < code.length) {
          if (code[end] === '{') depth++;
          if (code[end] === '}') depth--;
          end++;
        }
        // end now points just past the matching }
        const before = code.substring(0, deMatch.index);
        const after = code.substring(end);
        if (token) {
          code = before + `De=()=>{return new Se({baseUrl:Ue,userAgent:Ce,auth:"${token}"})}` + after;
        } else {
          code = before + `De=()=>{return new Se({baseUrl:Ue,userAgent:Ce})}` + after;
        }
        console.log('    De() replaced via position match');
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
