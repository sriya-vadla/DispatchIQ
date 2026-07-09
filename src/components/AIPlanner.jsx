import React, { useState } from "react";

export default function AIPlanner({ orders = [] }) {
  const [showAllTopOrders, setShowAllTopOrders] = useState(false);

  const urgentOrders =
    orders.filter(
      o =>
        o.Priority?.trim().toLowerCase() === "urgent" &&
        o.Status?.trim().toLowerCase() !== "delivered"
    );

  const tomorrowOrders =
    orders.filter(
      o =>
        o.Status?.trim().toLowerCase() === "scheduled" ||
        o.Status?.trim().toLowerCase() === "pending"
    );

  const highRiskOrders =
    urgentOrders.filter(
      o =>
        Number(o.OrderValue || 0) > 100000
    );

  const revenueAtRisk =
    urgentOrders.reduce(
      (sum, order) =>
        sum + Number(order.OrderValue || 0),
      0
    );

  const sortedUrgentOrders =
    [...urgentOrders]
      .sort(
        (a, b) =>
          Number(b.OrderValue || 0) -
          Number(a.OrderValue || 0)
      );

  const topOrders = showAllTopOrders ? sortedUrgentOrders : sortedUrgentOrders.slice(0, 10);

  const regionCounts = {};

  urgentOrders.forEach(order => {

    const region =
      order.Region || "Unknown";

    regionCounts[region] =
      (regionCounts[region] || 0) + 1;

  });

  const topRegions =
    Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  let delayRisk = "LOW";

  if (urgentOrders.length > 100) {
    delayRisk = "HIGH";
  }
  else if (urgentOrders.length > 50) {
    delayRisk = "MEDIUM";
  }

  const riskColor =
    delayRisk === "HIGH"
      ? "#dc2626"
      : delayRisk === "MEDIUM"
      ? "#f59e0b"
      : "#16a34a";

  return (

    <div>

      <h2>
        🤖 AI Dispatch Control Center
      </h2>

      {/* KPI Cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
          marginBottom: "25px"
        }}
      >

        <div className="card">
          <h3>🚨 Attention Required</h3>
          <h1>{urgentOrders.length}</h1>
        </div>

        <div className="card">
          <h3>📅 Due Tomorrow</h3>
          <h1>{tomorrowOrders.length}</h1>
        </div>

        <div className="card">
          <h3>💰 Revenue At Risk</h3>
          <h1>
            ₹{revenueAtRisk.toLocaleString()}
          </h1>
        </div>

        <div className="card">
          <h3>⚠ Delay Risk</h3>
          <h1
            style={{
              color: riskColor
            }}
          >
            {delayRisk}
          </h1>
        </div>

        <div className="card">
          <h3>🔴 High Risk Orders</h3>
          <h1>{highRiskOrders.length}</h1>
        </div>

      </div>

      {/* AI Action Plan */}

      <div
        style={{
          background: "#fff8e1",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "25px"
        }}
      >

        <h3>
          🚀 AI Dispatch Action Plan
        </h3>

        <ul
          style={{
            lineHeight: "2"
          }}
        >

          <li>
            Dispatch
            {" "}
            <strong>
              {highRiskOrders.length}
            </strong>
            {" "}
            high-risk orders before 11:00 AM.
          </li>

          <li>
            Allocate additional dispatch resources to
            {" "}
            <strong>
              {topRegions.length
                ? topRegions[0][0]
                : "N/A"}
            </strong>
            {" "}
            region.
          </li>

          <li>
            Prioritize Urgent + Scheduled orders
            before Pending orders.
          </li>

          <li>
            Monitor
            {" "}
            <strong>
              {tomorrowOrders.length}
            </strong>
            {" "}
            orders due tomorrow.
          </li>

          <li>
            Immediate action can protect
            {" "}
            <strong>
              ₹{Math.round(
                revenueAtRisk * 0.3
              ).toLocaleString()}
            </strong>
            {" "}
            in revenue.
          </li>

        </ul>

      </div>

      {/* Top Orders */}

      <h3>
        🚚 Top Priority Orders
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse"
        }}
      >

        <thead>

          <tr
            style={{
              background: "#f3f4f6"
            }}
          >

            <th>Order ID</th>
            <th>Customer</th>
            <th>Region</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Revenue</th>

          </tr>

        </thead>

        <tbody>

          {topOrders.map(order => (

            <tr key={order.OrderID}>

              <td>{order.OrderID}</td>
              <td>{order.Customer}</td>
              <td>{order.Region}</td>
              <td>{order.Priority}</td>
              <td>{order.Status}</td>

              <td>
                ₹{Number(
                  order.OrderValue
                ).toLocaleString()}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {sortedUrgentOrders.length > 10 && (
        <button className="view-all-btn" onClick={() => setShowAllTopOrders(p => !p)}>
          {showAllTopOrders ? (
            <><span>▲</span> Show Top 10 Only</>
          ) : (
            <><span>▼</span> View All {sortedUrgentOrders.length} Priority Orders</>
          )}
        </button>
      )}

      <br />

      {/* Region Ranking */}

      <h3>
        🌍 Region Priority Ranking
      </h3>

      <table
        style={{
          width: "60%",
          borderCollapse: "collapse"
        }}
      >

        <thead>

          <tr>
            <th>Region</th>
            <th>Urgent Orders</th>
          </tr>

        </thead>

        <tbody>

          {topRegions.map(region => (

            <tr key={region[0]}>

              <td>{region[0]}</td>
              <td>{region[1]}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );
}