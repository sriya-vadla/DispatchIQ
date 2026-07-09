const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('LIGHT THEME OVERRIDES')) {
    console.log(`Found on line ${idx + 1}`);
  }
});
