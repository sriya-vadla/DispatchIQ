const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('===') || line.includes('---')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
