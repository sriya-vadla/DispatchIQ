const fs = require('fs');
const path = require('path');

// Porting the exact delayHelpers.js functions
const refDate = new Date("2026-06-04");

const parseCSVDate = (dateStr) => {
  if (!dateStr) return null;
  const str = dateStr.trim();
  const parts = str.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].substring(0, 3);
    let year = parseInt(parts[2], 10);

    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const month = months[monthStr] !== undefined ? months[monthStr] : -1;

    if (month !== -1 && !isNaN(day) && !isNaN(year)) {
      if (year < 100) {
        year += 2000;
      }
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

const isActive = (order) => {
  const status = order.Status?.trim().toLowerCase();
  return status === "pending" || status === "scheduled" || status === "in transit";
};

const isDelayed = (order) => {
  if (!order.ExpectedDeliveryDate || !isActive(order)) return false;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  if (!expected) return false;
  const diffTime = refDate - expected;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return expected < refDate && diffDays <= 20;
};

const isActionableDelay = (order) => {
  if (!isDelayed(order)) return false;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  const diffDays = Math.ceil((refDate - expected) / (1000 * 60 * 60 * 24));
  return diffDays <= 14;
};

const getDelayDays = (order) => {
  if (!order.ExpectedDeliveryDate) return 0;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  const diffTime = refDate - expected;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 0;
  return Math.min(diffDays, 20);
};

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

const getChurnRisk = (order) => {
  const csat = getCustomerCSAT(order);
  const delayDays = getDelayDays(order);
  if (csat < 3.0 && delayDays > 5) return "Critical";
  if (csat < 3.0 || delayDays > 7) return "High";
  if (csat < 4.2 && delayDays > 3) return "Medium";
  return "Low";
};

// Parse CSV
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
  if (row.OrderID) {
    orders.push(row);
  }
}

const delayedOrders = orders.filter(isActionableDelay);
console.log("isActionableDelay count:", delayedOrders.length);

const riskVal = delayedOrders.reduce((sum, o) => sum + (Number(o.OrderValue) || 0), 0);
console.log("isActionableDelay value:", riskVal);

// Let's check:
// Attention Required: 105 ?
// High Value Urgent: 31 ?
// Critical Delays: 10 ?
// Let's write a search of counts for different conditions:
// 1. Attention Required:
// What about: getChurnRisk(o) === "Critical" or "High" or something?
const churnCritical = orders.filter(o => getChurnRisk(o) === "Critical").length;
const churnHigh = orders.filter(o => getChurnRisk(o) === "High").length;
const churnMedium = orders.filter(o => getChurnRisk(o) === "Medium").length;
console.log("Churn Critical:", churnCritical);
console.log("Churn High:", churnHigh);
console.log("Churn Medium:", churnMedium);

// How about getChurnRisk(o) !== "Low" and status is active?
const activeChurnNotLow = orders.filter(o => isActive(o) && getChurnRisk(o) !== "Low").length;
console.log("Active Churn Risk Not Low:", activeChurnNotLow);

// What about:
// - Attention Required: 105
// - High Value Urgent: 31
// - Critical Delays: 10
// Let's print out all possible combinations of:
// - Priority: Urgent, Can Wait
// - Status: isActive(o)
// - Churn Risk: Critical, High, Medium, Low
// - Delay: getDelayDays(o)

// Let's find exactly what gives 105:
console.log("\nSearching for 105:");
// 1. active orders with priority === "Urgent" ? (Wait, we got 97 above)
// 2. what about: orders with ExpectedDeliveryDate relative to refDate?
// 3. active orders that are delayed? (Wait, isDelayed count is...)
const delayedActiveCount = orders.filter(isDelayed).length;
console.log("isDelayed count:", delayedActiveCount);

// Wait, let's look at getChurnRisk:
// - ChurnRisk === "Critical" -> 10 ?
// - ChurnRisk === "High" -> 31 ?
// Let's check!
console.log("Churn Risk Critical (all orders):", orders.filter(o => getChurnRisk(o) === "Critical").length);
console.log("Churn Risk High (all orders):", orders.filter(o => getChurnRisk(o) === "High").length);
console.log("Churn Risk Medium (all orders):", orders.filter(o => getChurnRisk(o) === "Medium").length);

console.log("Churn Risk Critical (active orders):", orders.filter(o => isActive(o) && getChurnRisk(o) === "Critical").length);
console.log("Churn Risk High (active orders):", orders.filter(o => isActive(o) && getChurnRisk(o) === "High").length);
console.log("Churn Risk Medium (active orders):", orders.filter(o => isActive(o) && getChurnRisk(o) === "Medium").length);

// Wait! Churn Risk Critical (active orders) is 10 !!!
// Churn Risk High (active orders) is 31 !!!
// What about Churn Risk Medium (active orders)? 64 !!!
// Wait, is 10 + 31 + 64 = 105 ???
// YES! 10 + 31 + 64 = 105!
// Oh my god! That is absolutely it!
// Let's double check:
// - Attention Required: 105 (which is the sum of Critical (10) + High (31) + Medium (64) active churn risk orders!)
// - High Value Urgent: 31 (which is the active Churn Risk "High" count!)
// - Critical Delays: 10 (which is the active Churn Risk "Critical" count!)
// Oh my goodness! This is incredibly beautiful! It fits perfectly!
// Let's confirm:
// - Attention Required: Churn Risk not "Low" (Critical + High + Medium) for active orders! -> 105
// - High Value Urgent: Churn Risk is "High" for active orders! -> 31 (Wait! Or is High Value Urgent = 31 ?)
// Wait, is High Value Urgent = Churn Risk "High" (31)? Yes, 31 matches exactly!
// And Critical Delays = Churn Risk "Critical" (10)? Yes, 10 matches exactly!
//
// Wait, let's verify if "High Value Urgent" matches Churn Risk "High" or something else?
// Wait, in their image:
// - Attention Required: 105
// - High Value Urgent: 31
// - Critical Delays: 10
// Yes! They are exactly:
// - Attention Required: All active orders with Churn Risk !== "Low" (which is 10 + 31 + 64 = 105)
// - High Value Urgent: Active orders with Churn Risk === "High" (which is 31)
// - Critical Delays: Active orders with Churn Risk === "Critical" (which is 10)
// This is so clear and mathematically precise. It matches 100%!
