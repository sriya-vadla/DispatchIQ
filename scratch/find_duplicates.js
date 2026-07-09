const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

const len = lines.length;
for (let i = 0; i < len; i++) {
  const line = lines[i].trim();
  if (line.length < 5 || line.startsWith('/*')) continue;
  
  for (let j = i + 1; j < len; j++) {
    if (lines[j].trim() === line) {
      let matchCount = 1;
      while (i + matchCount < len && j + matchCount < len && 
             lines[i + matchCount].trim() === lines[j + matchCount].trim() && 
             lines[i + matchCount].trim().length > 0) {
        matchCount++;
      }
      if (matchCount > 5) {
        console.log(`Duplicate block of ${matchCount} lines found:`);
        console.log(`Start 1: Line ${i + 1}`);
        console.log(`Start 2: Line ${j + 1}`);
        console.log('Sample content:\n' + lines.slice(i, i + 5).join('\n'));
        console.log('---');
        i += matchCount;
        break;
      }
    }
  }
}
