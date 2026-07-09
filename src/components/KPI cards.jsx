import React from "react";
import { isActionableDelay } from "../utils/delayHelpers";

export default function KPICards({ orders = [], activeSubTab = "" }) {
  // 1. Total Booked Revenue
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.OrderValue) || 0), 0);

  // 2. Delayed Orders (SLA Breaches)
  const delayedOrders = orders.filter(isActionableDelay);
  const slaBreaches = delayedOrders.length;

  // 3. Revenue At Risk
  const revenueAtRisk = delayedOrders.reduce((sum, o) => sum + (Number(o.OrderValue) || 0), 0);
  const affectedCustomers = new Set(delayedOrders.map(o => o.Customer).filter(Boolean)).size;

  // 4. Fulfillment Rate
  const deliveredCount = orders.filter(o => o.Status?.trim().toLowerCase() === "delivered").length;
  const fulfillmentRate = orders.length > 0 ? ((deliveredCount / orders.length) * 100).toFixed(1) : "0.0";

  const formatRevenue = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="kpi-grid" style={{ gap: "15px", marginBottom: "0px" }}>
      
      {/* CARD 1: REVENUE */}
      <div 
        id="revenue-card" 
        className="kpi-card success"
        style={activeSubTab === "revenue" ? { border: "2px solid var(--accent-green)", boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)", transform: "scale(1.02)", transition: "all 0.3s ease" } : { transition: "all 0.3s ease" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="tooltip-container">
            <h3>Revenue</h3>
            <span className="tooltip-text">Total value of all booked orders in the system.</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <p className="value">{formatRevenue(totalRevenue)}</p>
        <p className="subtitle">
          <span style={{ color: "#a7f3d0" }}>Overall sales</span> booking value
        </p>
      </div>

      {/* CARD 2: REVENUE AT RISK */}
      <div 
        id="risk-card" 
        className="kpi-card danger"
        style={activeSubTab === "risk" ? { border: "2px solid var(--accent-red)", boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)", transform: "scale(1.02)", transition: "all 0.3s ease" } : { transition: "all 0.3s ease" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="tooltip-container">
            <h3>Revenue At Risk</h3>
            <span className="tooltip-text">Total value of shipments currently breaching delivery SLA.</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <p className="value">{formatRevenue(revenueAtRisk)}</p>
        <p className="subtitle">
          <span style={{ color: "#fca5a5", fontWeight: "700" }}>{affectedCustomers} Customers Affected</span>
        </p>
      </div>

      {/* CARD 3: SLA BREACHES */}
      <div 
        id="breaches-card" 
        className="kpi-card warning"
        style={activeSubTab === "breaches" ? { border: "2px solid var(--accent-amber)", boxShadow: "0 0 15px rgba(245, 158, 11, 0.4)", transform: "scale(1.02)", transition: "all 0.3s ease" } : { transition: "all 0.3s ease" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="tooltip-container">
            <h3>SLA Breaches</h3>
            <span className="tooltip-text">Service Level Agreement: Number of active shipments exceeding target delivery timelines.</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>
        <p className="value">{slaBreaches.toLocaleString()}</p>
        <p className="subtitle">
          <span style={{ color: "#fef08a" }}>Active delayed</span> order count
        </p>
      </div>

      {/* CARD 4: FULFILLMENT RATE */}
      <div 
        id="fulfillment-card" 
        className="kpi-card purple"
        style={activeSubTab === "fulfillment" ? { border: "2px solid var(--accent-purple)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)", transform: "scale(1.02)", transition: "all 0.3s ease" } : { transition: "all 0.3s ease" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="tooltip-container">
            <h3>Fulfillment Rate</h3>
            <span className="tooltip-text">Percentage of total orders successfully delivered to customers.</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <p className="value">{fulfillmentRate}%</p>
        <p className="subtitle">
          <span style={{ color: "#e9d5ff" }}>Delivered orders</span> ratio
        </p>
      </div>

    </div>
  );
}

