const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\Sriya\\.gemini\\antigravity\\brain\\6804a32f-ff13-473b-8a0c-7e2a47fb3b50';

const list = fs.readdirSync(dir);
list.forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.includes('![')) {
      console.log(`File: ${file}`);
      const matches = content.match(/!\[.*?\]\((.*?)\)/g);
      console.log(matches);
    }
  }
});
