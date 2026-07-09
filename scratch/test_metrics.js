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

// Target metrics:
// Attention Required: 105
// High Value Urgent: 31
// Critical Delays: 10

// Let's test different expressions:
// 1. High Value Urgent = active and OrderValue >= 100000
const highValueUrgent = orders.filter(o => isActive(o) && Number(o.OrderValue || 0) >= 100000).length;
console.log("active & OrderValue >= 100000:", highValueUrgent);

// 2. Critical Delays = delayDays > 5 && delayDays <= 14 && isActive
const criticalDelays = orders.filter(o => isActive(o) && getDelayDays(o) > 5 && getDelayDays(o) <= 14).length;
console.log("isActive & 5 < delay <= 14:", criticalDelays);

// What about: getDelayDays(o) > 5 && getDelayDays(o) <= 14 (all orders)?
console.log("all & 5 < delay <= 14:", orders.filter(o => getDelayDays(o) > 5 && getDelayDays(o) <= 14).length);

// What about delayDays > 10 && delayDays <= 14?
console.log("isActive & 10 < delay <= 14:", orders.filter(o => isActive(o) && getDelayDays(o) > 10 && getDelayDays(o) <= 14).length);

// 3. Attention Required:
// What if it is: active & (o.Priority === "Urgent" || isActionableDelay(o)) ?
const att1 = orders.filter(o => isActive(o) && (o.Priority?.trim().toLowerCase() === "urgent" || isActionableDelay(o))).length;
console.log("isActive & (Priority==Urgent || isActionableDelay):", att1);

// What if: isActive & o.Priority === "Urgent" & getDelayDays(o) > 0 ?
const att2 = orders.filter(o => isActive(o) && o.Priority?.trim().toLowerCase() === "urgent" && getDelayDays(o) > 0).length;
console.log("isActive & Priority==Urgent & delay > 0:", att2);

// What about: active & CSAT < 3.0?
const att3 = orders.filter(o => isActive(o) && getDelayDays(o) > 0 && getDelayDays(o) <= 14 && o.Priority === "Urgent").length;
console.log("isActive & delay <= 14 & delay > 0 & Priority==Urgent:", att3);

// Let's check: is there a subset of orders?
// What if: orders.filter(o => isActive(o) && o.Priority === "Urgent" && Number(o.OrderValue) >= 10000).length ?
console.log("isActive & Priority==Urgent & Value >= 10000:", orders.filter(o => isActive(o) && o.Priority === "Urgent" && Number(o.OrderValue) >= 10000).length);

// What if Attention Required is: active & CSAT < 4.0?
// Let's check CSAT scores
const getCustomerCSAT = (order) => {
  if (!order || !order.Customer) return 5.0;
  const str = (order.OrderID || "") + (order.Customer || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const val = 1.5 + (Math.abs(hash) % 36) / 10;
  return Number(val.toFixed(1));
};
const lowCSAT = orders.filter(o => isActive(o) && getCustomerCSAT(o) <= 3.0).length;
console.log("isActive & CSAT <= 3.0:", lowCSAT);

// What about: isActive & (isActionableDelay or Priority == Urgent or ChurnRisk != Low)?
// Let's print out all possible combinations of conditions that can yield 105:
// Can we find any simple condition?
// e.g. Priority == 'Urgent' & (something)?
// Let's search!
for (let valLimit = 0; valLimit <= 300000; valLimit += 1000) {
  const count = orders.filter(o => isActive(o) && Number(o.OrderValue || 0) >= valLimit).length;
  if (count === 105) {
    console.log(`isActive & OrderValue >= ${valLimit} yields count 105!`);
  }
}
for (let valLimit = 0; valLimit <= 300000; valLimit += 1000) {
  const count = orders.filter(o => isActive(o) && o.Priority === "Urgent" && Number(o.OrderValue || 0) >= valLimit).length;
  if (count === 105) {
    console.log(`isActive & Priority==Urgent & OrderValue >= ${valLimit} yields count 105!`);
  }
}
for (let daysLimit = 0; daysLimit <= 20; daysLimit++) {
  const count = orders.filter(o => isActive(o) && getDelayDays(o) >= daysLimit).length;
  if (count === 105) {
    console.log(`isActive & delayDays >= ${daysLimit} yields count 105!`);
  }
}
