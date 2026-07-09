import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function StatusChart({ orders = [] }) {
  const statusCounts = {};

  orders.forEach(order => {
    const status = order.Status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const data = Object.keys(statusCounts).map(
    status => ({
      name: status,
      value: statusCounts[status]
    })
  );

  // Semantic color mapping for order statuses
  const STATUS_COLORS = {
    "Delivered": "#10b981",    // Emerald Green
    "In Transit": "#3b82f6",   // Vibrant Blue
    "Pending": "#f59e0b",      // Amber Orange
    "Scheduled": "#8b5cf6",    // Purple
    "Returned": "#ef4444"      // Crimson Red
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={0}
          stroke="#ffffff"
          strokeWidth={1}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={STATUS_COLORS[entry.name] || "#64748b"}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", borderRadius: "8px" }}
          itemStyle={{ color: "var(--text-primary)" }}
        />

        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: "0.82rem" }}
        />

        {/* Donut Center Metrics: Total Count on Top of Label */}
        <text
          x="50%"
          y="43%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize="1.35rem"
          fontWeight="800"
        >
          {orders.length}
        </text>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-secondary)"
          fontSize="0.62rem"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          TOTAL BOOKINGS
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
