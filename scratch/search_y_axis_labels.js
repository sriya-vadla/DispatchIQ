const fs = require('fs');
const path = require('path');

function search(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      search(full);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('<YAxis') && line.includes('label')) {
          console.log(`${full}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  });
}

search('src');
