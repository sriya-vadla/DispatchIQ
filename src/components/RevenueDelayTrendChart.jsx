import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { parseCSVDate, getDelayDays } from "../utils/delayHelpers";

export default function RevenueDelayTrendChart({ orders = [] }) {
  const refDate = new Date("2026-06-04");

  // Aggregate daily data (Last 30 Days before June 4, 2026)
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
      revenue: 0,
      totalOrders: 0,
      totalDelayDays: 0
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
        const delay = getDelayDays(order);

        dailyMap[dateKey].revenue += value;
        dailyMap[dateKey].totalOrders += 1;
        dailyMap[dateKey].totalDelayDays += delay;
      }
    }
  });

  const chartData = Object.values(dailyMap)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(day => ({
      name: day.name,
      revenue: day.revenue,
      avgDelay: day.totalOrders > 0 ? Number((day.totalDelayDays / day.totalOrders).toFixed(1)) : 0
    }));

  const formatYAxisLeft = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const formatYAxisRight = (value) => {
    return `${value}d`;
  };

  const formatTooltip = (value, name) => {
    if (name === "Revenue") {
      return [`₹${value.toLocaleString()}`, "Revenue"];
    }
    return [`${value} Days`, "Avg Delay"];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.85rem" }}>
        Analyzing booking revenue against average delivery transit delays over the last 30 days.
      </p>

      <div style={{ height: "320px", width: "100%" }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                tick={{ fontSize: 9 }} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={45} 
              />
              <YAxis 
                yAxisId="left"
                stroke="var(--accent-blue)" 
                tickFormatter={formatYAxisLeft} 
                tick={{ fontSize: 11 }} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="var(--accent-amber)" 
                tickFormatter={formatYAxisRight} 
                tick={{ fontSize: 11 }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                formatter={formatTooltip}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Revenue"
                fill="var(--accent-blue)"
                radius={[4, 4, 0, 0]}
                opacity={0.7}
              />
              
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgDelay"
                name="Avg Delay"
                stroke="var(--accent-amber)"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
            No sales data available.
          </div>
        )}
      </div>
    </div>
  );
}
