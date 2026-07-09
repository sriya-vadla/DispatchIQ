const fs = require('fs');
const content = fs.readFileSync('src/components/AnalyticsView.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Correlation') || line.includes('Delay Rates') || line.includes('YAxis') || line.includes('label=')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
