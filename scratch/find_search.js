const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('global-search-input') || line.includes('global-search-wrapper')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
