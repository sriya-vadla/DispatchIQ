const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');

// Let's print out lines around 1560 to 1580 to see what the transition looks like.
const lines = content.split('\n');
for (let i = 1550; i < 1580; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
