const fs = require('fs');
const Papa = require('papaparse');

const csvData = fs.readFileSync('public/data/AI_Dispatch_Sales_Dataset.csv', 'utf8');
const results = Papa.parse(csvData, { header: true });

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
  return new Date(str);
};

const orders = results.data.filter(o => o.OrderID);

const isActive = (order) => {
  const status = order.Status?.trim().toLowerCase();
  return status === "pending" || status === "scheduled" || status === "in transit";
};

const isDelayedAt = (order, date) => {
  if (!order.ExpectedDeliveryDate || !isActive(order)) return false;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  if (!expected) return false;
  const diffTime = date - expected;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return expected < date && diffDays <= 20;
};

const isActionableDelayAt = (order, date) => {
  if (!isDelayedAt(order, date)) return false;
  const expected = parseCSVDate(order.ExpectedDeliveryDate);
  const diffDays = Math.ceil((date - expected) / (1000 * 60 * 60 * 24));
  return diffDays <= 14;
};

const getDelayedCountForDate = (date) => {
  return orders.filter(o => isActionableDelayAt(o, date)).length;
};

console.log("May 30:", getDelayedCountForDate(new Date(2026, 4, 30)));
console.log("June 1:", getDelayedCountForDate(new Date(2026, 5, 1)));
console.log("June 2:", getDelayedCountForDate(new Date(2026, 5, 2)));
console.log("June 3:", getDelayedCountForDate(new Date(2026, 5, 3)));
console.log("June 4:", getDelayedCountForDate(new Date(2026, 5, 4)));
