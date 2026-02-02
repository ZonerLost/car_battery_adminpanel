import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MonthlyReportsTrendChart = ({ data = [], loading = false }) => {
  const chartData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        total: Number(item.total) || 0,
      }))
    : [];

  const hasBars = chartData.some((item) => Number(item.total) > 0);

  return (
    <div className="w-full h-full min-h-[220px] sm:min-h-[240px] min-w-0">
      {loading ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart...</div>
      ) : hasBars ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.15)" }}
              contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: "#e5e7eb" }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#ff5a5f" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-slate-500">
          No reports for the selected range
        </div>
      )}
    </div>
  );
};

export default MonthlyReportsTrendChart;
