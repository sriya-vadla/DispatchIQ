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

const refDate = new Date("2026-06-04");

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
  if (!expected) return 0;
  const diffTime = refDate - expected;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const orders = results.data.filter(o => o.OrderID);

// Test query parser function
const getAnswer = (query) => {
  const queryLower = query.toLowerCase();

  // 1. Courier comparison
  if (
    queryLower.includes("courier") ||
    queryLower.includes("delivery service") ||
    queryLower.includes("carrier") ||
    queryLower.includes("bluedart") ||
    queryLower.includes("delhivery") ||
    queryLower.includes("dtdc") ||
    queryLower.includes("ecom express")
  ) {
    const courierStats = {};
    orders.forEach(o => {
      if (!o.Courier) return;
      const c = o.Courier.trim();
      if (!courierStats[c]) {
        courierStats[c] = { total: 0, delayed: 0, totalDelayDays: 0 };
      }
      courierStats[c].total++;
      if (isActionableDelay(o)) {
        courierStats[c].delayed++;
        courierStats[c].totalDelayDays += getDelayDays(o);
      }
    });

    const summary = Object.keys(courierStats).map(c => {
      const stats = courierStats[c];
      const delayRate = ((stats.delayed / stats.total) * 100).toFixed(1);
      const avgDelay = stats.delayed > 0 ? (stats.totalDelayDays / stats.delayed).toFixed(1) : "0.0";
      return {
        name: c,
        total: stats.total,
        delayed: stats.delayed,
        delayRate: parseFloat(delayRate),
        avgDelay: parseFloat(avgDelay)
      };
    });

    // Check if comparing specific couriers
    const hasBlueDart = queryLower.includes("bluedart");
    const hasDelhivery = queryLower.includes("delhivery");
    const hasDTDC = queryLower.includes("dtdc");
    const hasEcom = queryLower.includes("ecom");

    if (hasBlueDart && hasDelhivery) {
      const bd = summary.find(s => s.name.toLowerCase().includes("bluedart"));
      const dv = summary.find(s => s.name.toLowerCase().includes("delhivery"));
      if (bd && dv) {
        const better = bd.delayRate < dv.delayRate ? bd.name : dv.name;
        return `Comparing BlueDart and Delhivery:
- **BlueDart:** ${bd.delayRate}% delay rate (${bd.delayed} delays out of ${bd.total} orders, avg delay ${bd.avgDelay} days).
- **Delhivery:** ${dv.delayRate}% delay rate (${dv.delayed} delays out of ${dv.total} orders, avg delay ${dv.avgDelay} days).

**Recommendation:** ${better} is currently performing better with a lower active delay rate of ${Math.min(bd.delayRate, dv.delayRate)}%.`;
      }
    }

    // Default courier performance summary
    let responseText = "Here is the performance summary of our delivery services:\n";
    summary.forEach(s => {
      responseText += `- **${s.name}:** Delay Rate: ${s.delayRate}%, Avg Delay: ${s.avgDelay} days (Active delays: ${s.delayed}/${s.total})\n`;
    });
    const best = summary.reduce((prev, curr) => prev.delayRate < curr.delayRate ? prev : curr);
    responseText += `\n**Recommendation:** **${best.name}** is currently our top-performing courier with the lowest delay rate (${best.delayRate}%).`;
    return responseText;
  }

  // 2. Sales Executive performance
  if (queryLower.includes("sales executive") || queryLower.includes("salesperson") || queryLower.includes("agent") || queryLower.includes("best executive") || queryLower.includes("who sold the most")) {
    const execStats = {};
    orders.forEach(o => {
      if (!o.SalesExecutive) return;
      const e = o.SalesExecutive.trim();
      const val = parseFloat(o.OrderValue) || 0;
      if (!execStats[e]) {
        execStats[e] = { totalOrders: 0, totalRevenue: 0 };
      }
      execStats[e].totalOrders++;
      execStats[e].totalRevenue += val;
    });

    const sortedExecs = Object.keys(execStats).map(e => ({
      name: e,
      orders: execStats[e].totalOrders,
      revenue: execStats[e].totalRevenue
    })).sort((a, b) => b.revenue - a.revenue);

    let responseText = "Here are our top sales executives by total revenue generated:\n";
    sortedExecs.forEach((exec, idx) => {
      responseText += `${idx + 1}. **${exec.name}:** ₹${(exec.revenue / 100000).toFixed(2)}L revenue (${exec.orders} orders)\n`;
    });
    return responseText;
  }

  return "No match";
};

console.log(getAnswer("which delivery service is better bluedart or delhivery"));
console.log("\n-------------------\n");
console.log(getAnswer("who is the best sales executive"));
