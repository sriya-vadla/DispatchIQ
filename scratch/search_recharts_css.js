const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');

const regex = /\.recharts-[a-zA-Z-]*(\s|\{)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found recharts class: ${match[0]}`);
  console.log(content.substring(Math.max(0, match.index - 20), Math.min(content.length, match.index + 80)));
  console.log('---');
}
