import React, { useState } from "react";

export default function DelayPredictor({ orders = [] }) {
  const [showAllHighRisk, setShowAllHighRisk] = useState(false);

  const tomorrowOrders =
    orders.filter(order => {

      const status =
        order.Status?.toLowerCase();

      return (
        status === "scheduled" ||
        status === "pending"
      );
    });

  const highRiskOrders =
    tomorrowOrders.filter(order => {

      const revenue =
        Number(order.OrderValue);

      const urgent =
        order.Priority === "Urgent";

      return urgent && revenue > 100000;

    });

  return (

    <div>

      <h2>
        🚨 Delay Prediction Center
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "15px",
          marginBottom: "20px"
        }}
      >

        <div className="card">
          <h3>
            Orders Due Tomorrow
          </h3>

          <h1>
            {tomorrowOrders.length}
          </h1>
        </div>

        <div className="card">
          <h3>
            High Risk Orders
          </h3>

          <h1
            style={{ color: "red" }}
          >
            {highRiskOrders.length}
          </h1>
        </div>

      </div>

      <h3>
        AI Flagged Orders
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse"
        }}
      >

        <thead>

          <tr>

            <th>Order ID</th>
            <th>Customer</th>
            <th>Priority</th>
            <th>Revenue</th>
            <th>Risk</th>

          </tr>

        </thead>

        <tbody>

          {(showAllHighRisk ? highRiskOrders : highRiskOrders.slice(0, 10)).map(order => (

            <tr
              key={order.OrderID}
            >

              <td>
                {order.OrderID}
              </td>

              <td>
                {order.Customer}
              </td>

              <td>
                {order.Priority}
              </td>

              <td>
                ₹{Number(
                  order.OrderValue
                ).toLocaleString()}
              </td>

              <td
                style={{
                  color: "red",
                  fontWeight: "bold"
                }}
              >
                HIGH
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {highRiskOrders.length > 10 && (
        <button className="view-all-btn" onClick={() => setShowAllHighRisk(p => !p)}>
          {showAllHighRisk ? (
            <><span>▲</span> Show Top 10 Only</>
          ) : (
            <><span>▼</span> View All {highRiskOrders.length} High Risk Orders</>
          )}
        </button>
      )}

    </div>

  );
}