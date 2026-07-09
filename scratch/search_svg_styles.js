const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('recharts') || line.toLowerCase().includes('svg') || line.toLowerCase().includes('text') || line.toLowerCase().includes('tspan')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
