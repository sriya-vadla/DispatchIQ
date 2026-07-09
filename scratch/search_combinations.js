const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'public', 'data', 'AI_Dispatch_Sales_Dataset.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
const headers = lines[0].split(',').map(h => h.replace(/^\uFEFF/, "").trim());
const orders = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cols.push(current.trim());
  
  const row = {};
  headers.forEach((h, idx) => {
    row[h] = cols[idx];
  });
  if (row.OrderID) orders.push(row);
}

// 1. Let's find single column filters matching 105, 31, 10
const counts = {};
const columns = Object.keys(orders[0]);

columns.forEach(col => {
  const valCounts = {};
  orders.forEach(o => {
    const val = o[col];
    valCounts[val] = (valCounts[val] || 0) + 1;
  });
  Object.entries(valCounts).forEach(([val, count]) => {
    if ([105, 31, 10].includes(count)) {
      console.log(`Single column: ${col} === "${val}" yields count ${count}`);
    }
  });
});

// 2. Let's find two-column filters matching 105, 31, 10
for (let i = 0; i < columns.length; i++) {
  for (let j = i + 1; j < columns.length; j++) {
    const col1 = columns[i];
    const col2 = columns[j];
    const pairCounts = {};
    orders.forEach(o => {
      const key = `${o[col1]} | ${o[col2]}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    });
    Object.entries(pairCounts).forEach(([key, count]) => {
      if ([105, 31, 10].includes(count)) {
        console.log(`Two columns: ${col1} and ${col2} (${key}) yields count ${count}`);
      }
    });
  }
}
