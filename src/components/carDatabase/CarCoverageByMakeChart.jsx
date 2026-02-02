import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CarCoverageByMakeChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center text-xs text-slate-500">
        No data for selected filters
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={220} minWidth={0}>
        <BarChart data={data} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="make" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.15)" }}
            contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: "#e5e7eb" }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#ff5a5f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CarCoverageByMakeChart;
