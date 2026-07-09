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

export default function DispatchTrendChart({ orders = [] }) {

  const dailyData = {};

  orders.forEach(order => {

    const date = order.DispatchDate;

    if (!date) return;

    if (!dailyData[date]) {

      dailyData[date] = {
        date,
        total: 0,
        urgent: 0,
        completed: 0
      };

    }

    dailyData[date].total += 1;

    if (
      order.Priority?.trim().toLowerCase() ===
      "urgent"
    ) {
      dailyData[date].urgent += 1;
    }

    if (
      order.Status?.trim().toLowerCase() ===
      "delivered"
    ) {
      dailyData[date].completed += 1;
    }

  });

  const chartData =
    Object.values(dailyData);

  return (

    <ResponsiveContainer
      width="100%"
      height={450}
    >

      <LineChart data={chartData}>

        <CartesianGrid
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey="date"
        />

        <YAxis />

        <Tooltip />

        <Legend />

        <Line
          type="monotone"
          dataKey="total"
          stroke="#2563eb"
          strokeWidth={3}
          name="Total Orders"
        />

        <Line
          type="monotone"
          dataKey="urgent"
          stroke="#f59e0b"
          strokeWidth={3}
          name="Urgent Orders Scheduled"
        />

        <Line
          type="monotone"
          dataKey="completed"
          stroke="#16a34a"
          strokeWidth={3}
          name="Successfully Completed"
        />

      </LineChart>

    </ResponsiveContainer>

  );

}