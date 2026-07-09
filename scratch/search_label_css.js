const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('label') || line.toLowerCase().includes('axis') || line.toLowerCase().includes('y-axis')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
