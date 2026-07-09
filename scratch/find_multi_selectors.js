const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');

// A simple regex to find CSS selectors and their line numbers
// This is not perfect but it will find selectors before '{'
const lines = content.split('\n');
const selectorPositions = {};

let braceCount = 0;
let currentSelector = '';
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('/*') || line.startsWith('*') || line.endsWith('*/')) continue;
  
  if (braceCount === 0) {
    if (line.includes('{')) {
      const parts = line.split('{');
      currentSelector = (currentSelector + ' ' + parts[0]).trim();
      braceCount++;
      if (currentSelector) {
        if (!selectorPositions[currentSelector]) {
          selectorPositions[currentSelector] = [];
        }
        selectorPositions[currentSelector].push(i + 1);
      }
      currentSelector = '';
    } else {
      currentSelector = (currentSelector + ' ' + line).trim();
    }
  } else {
    // inside rules
    // check for braces
    for (let char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  }
}

// Print selectors that are defined multiple times
console.log('Selectors defined multiple times:');
for (const [sel, linesList] of Object.entries(selectorPositions)) {
  if (linesList.length > 1 && sel.trim().length > 0) {
    console.log(`- "${sel}": lines ${linesList.join(', ')}`);
  }
}
