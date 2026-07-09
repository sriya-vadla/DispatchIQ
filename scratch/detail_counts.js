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

// Helpers
const refDate = new Date("2026-06-04");
const parseCSVDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].substring(0, 3);
    let year = parseInt(parts[2], 10);
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = months[monthStr];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }
  }
  return null;
};
const getDelayDays = (order) => {
  if (!order.ExpectedDeliveryDate) return 0;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  if (!expected) return 0;
  const diffTime = refDate - expected;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? Math.min(diffDays, 20) : 0;
};
const isActive = (order) => {
  const s = order.Status?.trim().toLowerCase();
  return s === "pending" || s === "scheduled" || s === "in transit";
};
const isActionableDelay = (order) => {
  const status = order.Status?.trim().toLowerCase();
  const returnFlag = order.ReturnFlag?.trim().toLowerCase();
  if (status === 'delivered' || returnFlag === 'yes') return false;
  const delayDays = getDelayDays(order);
  return delayDays >= 1 && delayDays <= 14;
};

const counts = {};
orders.filter(isActionableDelay).forEach(o => counts[o.Courier] = (counts[o.Courier] || 0) + 1);
console.log("Courier counts for actionable delays:", counts);
