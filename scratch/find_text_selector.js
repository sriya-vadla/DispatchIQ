const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');

const regex = /(^|\s|,)text(\s|,|\{)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found "text" selector match at index ${match.index}`);
  // print surrounding characters
  console.log(content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 50)));
  console.log('---');
}
