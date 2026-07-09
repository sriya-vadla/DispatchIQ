const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'public', 'data', 'AI_Dispatch_Sales_Dataset.csv');
const content = fs.readFileSync(csvPath, 'utf8');

const parseCSV = (text) => {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Simple CSV parser handling quotes if needed, but here simple split is mostly fine since values don't contain commas
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
    rows.push(row);
  }
  return rows;
};

const orders = parseCSV(content);

// Helper function for delay matching delayHelpers.js:
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[parts[1].toLowerCase()];
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
};

const getDelayDays = (order) => {
  const expectedDate = parseDate(order.ExpectedDeliveryDate || order.ExpectedDate);
  if (!expectedDate) return 0;
  const pivotDate = new Date(2026, 5, 4); // June 4, 2026
  const diffTime = pivotDate - expectedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const isActionableDelay = (order) => {
  const status = order.Status?.trim().toLowerCase();
  const returnFlag = order.ReturnFlag?.trim().toLowerCase();
  if (status === 'delivered' || returnFlag === 'yes') return false;
  return getDelayDays(order) > 0;
};

console.log("Total Orders:", orders.length);

const actionableDelays = orders.filter(isActionableDelay);
console.log("Actionable Delays Count:", actionableDelays.length);
console.log("Actionable Delays Total Value:", actionableDelays.reduce((sum, o) => sum + Number(o.OrderValue || 0), 0));

// Count worst couriers
const courierDelays = {};
actionableDelays.forEach(o => {
  courierDelays[o.Courier] = (courierDelays[o.Courier] || 0) + 1;
});
console.log("Courier Delays:", courierDelays);

// Let's check how we can get 105, 31, 10
// Is there a status/priority filter?
const priorityGroups = {};
orders.forEach(o => {
  const p = o.Priority?.trim();
  priorityGroups[p] = (priorityGroups[p] || 0) + 1;
});
console.log("Priority groups (All orders):", priorityGroups);

const activeOrders = orders.filter(o => o.Status?.trim().toLowerCase() !== 'delivered' && o.ReturnFlag?.trim().toLowerCase() !== 'yes');
console.log("Active Orders (Not Delivered, Not Returned):", activeOrders.length);
const activePriorityGroups = {};
activeOrders.forEach(o => {
  const p = o.Priority?.trim();
  activePriorityGroups[p] = (activePriorityGroups[p] || 0) + 1;
});
console.log("Priority groups (Active orders):", activePriorityGroups);

// Let's test filter for Attention Required, High Value Urgent, Critical Delays
// Attention Required = 105 ?
// High Value Urgent = 31 ?
// Critical Delays = 10 ?
// Let's look for combinations that give these numbers.
// 1. Attention Required: Could it be some specific orders?
// Let's search if any condition matches 105
console.log("Checking conditions matching 105...");
const cond1 = orders.filter(o => o.Status?.trim().toLowerCase() !== 'delivered').length;
console.log("Not delivered:", cond1);

const cond2 = orders.filter(o => o.Status?.trim().toLowerCase() !== 'delivered' && o.Status?.trim().toLowerCase() !== 'returned').length;
console.log("Not delivered & Not returned (using status):", cond2);

const urgentCount = orders.filter(o => o.Priority?.trim().toLowerCase() === 'urgent').length;
console.log("All Urgent:", urgentCount);

const urgentActive = orders.filter(o => o.Priority?.trim().toLowerCase() === 'urgent' && o.Status?.trim().toLowerCase() !== 'delivered' && o.ReturnFlag?.trim().toLowerCase() !== 'yes').length;
console.log("Active Urgent:", urgentActive);

const delayedActive = orders.filter(o => isActionableDelay(o)).length;
console.log("Delayed Active (SLA breached):", delayedActive);

// What about expected delivery date delays > 5?
const delaysGreaterThan5 = orders.filter(o => isActionableDelay(o) && getDelayDays(o) > 5).length;
console.log("Delays > 5 days:", delaysGreaterThan5);

// Let's search for count of orders with certain criteria
const pendingScheduledInTransit = orders.filter(o => ['pending', 'scheduled', 'in transit'].includes(o.Status?.trim().toLowerCase())).length;
console.log("Pending/Scheduled/InTransit:", pendingScheduledInTransit);

const pendingScheduled = orders.filter(o => ['pending', 'scheduled'].includes(o.Status?.trim().toLowerCase())).length;
console.log("Pending/Scheduled:", pendingScheduled);
