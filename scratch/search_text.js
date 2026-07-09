const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath, query);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found "${query}" in ${filePath}`);
      }
    }
  });
}

searchDir('src', 'REVENUE (LTV)');
searchDir('src', 'Search Orders / Customers / Couriers');
searchDir('src', 'CSAT');
searchDir('src', 'Courier Delay Rates');
