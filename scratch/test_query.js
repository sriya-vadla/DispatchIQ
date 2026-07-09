const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Helper functions adapted from delayHelpers.js
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

function getIssueCategory(orderId, delay) {
  return "Delivery SLA Breached";
}

function getEscalationLevel(orderId, delay, val, isVIP) {
  return "Level 1";
}

function subtractDays(dateStr, days) {
  return dateStr;
}

function initializeTickets(ordersList) {
  const initial = [];
  let open = 0, inProg = 0, res = 0, esc = 0;
  let ticketIndex = 1;

  ordersList.forEach(order => {
    const isAct = isActive(order);
    const delay = getDelayDays(order);
    const val = Number(order.OrderValue || 0);

    let status = null;
    const orderNum = parseInt((order.OrderID || "").replace(/\D/g, ""), 10) || ticketIndex;
    const datePool = ["04-Jun-2026", "03-Jun-2026", "02-Jun-2026", "31-May-2026", "29-May-2026"];
    const lastUpdatedDate = datePool[orderNum % datePool.length];

    if (!isAct && delay > 0 && res < 108) {
      status = "Resolved";
      res++;
    } else if (isAct) {
      if (esc < 4 && delay > 5) {
        status = "Escalated";
        esc++;
      } else if (inProg < 12 && delay > 2) {
        status = "In Progress";
        inProg++;
      } else if (open < 24) {
        status = "Open";
        open++;
      }
    }

    if (status) {
      const owners = ["Ravi", "Priya", "Rahul", "Anjali", "Suresh", "Karthik"];
      const owner = owners[orderNum % owners.length];
      initial.push({
        id: `TKT${ticketIndex++}`,
        orderId: order.OrderID,
        status,
        owner
      });
    }
  });
  return initial;
}

// Load CSV and analyze
const csvPath = path.join(__dirname, '../public/data/AI_Dispatch_Sales_Dataset.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

Papa.parse(csvData, {
  header: true,
  complete: (results) => {
    const orders = results.data.map(row => {
      const cleanRow = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          const cleanKey = key.replace(/^\uFEFF/, "").trim();
          cleanRow[cleanKey] = typeof row[key] === "string" ? row[key].trim() : row[key];
        }
      }
      return cleanRow;
    }).filter(row => row.OrderID);

    const tickets = initializeTickets(orders);

    // Analyze for Priya and other executives
    const executives = ["Ravi", "Priya", "Rahul", "Anjali", "Suresh", "Karthik"];

    executives.forEach(exec => {
      // Metric 1: Delayed orders in orders list
      const delayedOrders = orders.filter(o => o.SalesExecutive === exec && isActionableDelay(o));
      const delayedCount = delayedOrders.length;

      // Metric 2: Revenue at Risk
      const revenueAtRisk = delayedOrders.reduce((sum, o) => sum + (Number(o.OrderValue) || 0), 0);

      // Metric 3: Escalated customers
      // Let's check: tickets where status === "Escalated" and order.SalesExecutive === exec
      const escalatedTickets = tickets.filter(t => t.status === "Escalated" && orders.some(o => o.OrderID === t.orderId && o.SalesExecutive === exec));

      // What if escalated customers means tickets where owner is the executive and status is "Escalated"?
      const escalatedByOwner = tickets.filter(t => t.owner === exec && t.status === "Escalated");

      console.log(`--- ${exec} ---`);
      console.log(`SalesExecutive Delayed Orders: ${delayedCount}`);
      console.log(`SalesExecutive Revenue at Risk: ₹${(revenueAtRisk / 100000).toFixed(2)}L (Raw: ₹${revenueAtRisk})`);
      console.log(`Escalated Tickets under SalesExecutive: ${escalatedTickets.length}`);
      console.log(`Escalated Tickets owned as Support Owner: ${escalatedByOwner.length}`);
    });
  }
});
