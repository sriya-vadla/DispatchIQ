import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { parseCSVDate, isActionableDelay } from "../utils/delayHelpers";

export default function RevenueChart({ orders = [] }) {
  const refDate = new Date("2026-06-04");

  // 1. Daily Revenue at Risk (Last 30 Days before June 4, 2026)
  const dailyMap = {};
  
  // Pre-populate dailyMap with all 31 days (30 days ago to refDate)
  for (let i = 30; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    dailyMap[dateKey] = {
      name: dateString,
      timestamp: d.getTime(),
      totalRevenue: 0,
      revenueAtRisk: 0
    };
  }

  orders.forEach(order => {
    if (!order.OrderedDate) return;
    const dateObj = parseCSVDate(order.OrderedDate);
    if (!dateObj || isNaN(dateObj.getTime())) return;

    // Check if it's within the last 30 days of our refDate
    const diffTime = refDate - dateObj;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 30) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (dailyMap[dateKey]) {
        const value = Number(order.OrderValue || 0);
        dailyMap[dateKey].totalRevenue += value;
        // Only sum revenue of delayed orders (revenue at risk)
        if (isActionableDelay(order)) {
          dailyMap[dateKey].revenueAtRisk += value;
        }
      }
    }
  });

  const chartData = Object.values(dailyMap)
    .sort((a, b) => a.timestamp - b.timestamp);

  const formatYAxis = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const formatTooltip = (value, name) => {
    return [`₹${value.toLocaleString()}`, name];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", border: "none", padding: 0, display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontWeight: "600" }}>
            <span>📉</span> Revenue vs Risk Trend (Last 30 Days)
          </h2>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "0.8rem" }}>
            Total processed revenue compared to delayed order revenue.
          </p>
        </div>
      </div>

      <div style={{ height: "320px", width: "100%", marginTop: "25px" }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 35, right: 40, left: 15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                tick={{ fontSize: 10 }} 
                interval={"preserveStartEnd"} 
                angle={-45} 
                textAnchor={"end"} 
                height={45} 
              />
              <YAxis stroke="var(--text-secondary)" tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                formatter={formatTooltip}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="Total Revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="revenueAtRisk"
                name="Revenue at Risk"
                stroke="#ef4444"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
            No revenue risk telemetry available.
          </div>
        )}
      </div>
    </div>
  );
}