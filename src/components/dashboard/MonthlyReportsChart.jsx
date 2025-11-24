import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "May", total: 300 },
  { month: "Jun", total: 380 },
  { month: "Jul", total: 420 },
  { month: "Aug", total: 460 },
  { month: "Sep", total: 480 },
  { month: "Oct", total: 520 },
];

const MonthlyReportsChart = () => {
  return (
    <div className="w-full h-64 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={24}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.15)" }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              borderColor: "#e5e7eb",
            }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#ff5a5f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyReportsChart;
