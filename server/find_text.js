const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          console.log(`FOUND in: ${fullPath}`);
        }
      } catch (e) {}
    }
  }
}

console.log('Searching for "v2.4"...');
searchDir('.', 'v2.4');

console.log('Searching for "PulseLab Enterprise"...');
searchDir('.', 'PulseLab Enterprise');
