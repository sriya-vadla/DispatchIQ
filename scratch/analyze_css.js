const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');
const lines = content.split('\n');

const seen = {};
const blockSize = 10;
for (let i = 0; i <= lines.length - blockSize; i++) {
  const block = lines.slice(i, i + blockSize).map(l => l.trim()).join('\n');
  if (block.length > 50) {
    if (seen[block]) {
      console.log(`Duplicate block of size ${blockSize} found at line ${i + 1} and line ${seen[block]}`);
      console.log('---');
      console.log(block.substring(0, 200));
      console.log('---');
      // skip over this block
      i += blockSize - 1;
    } else {
      seen[block] = i + 1;
    }
  }
}
