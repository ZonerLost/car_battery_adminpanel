import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#00c3ff", "#FF2D55", "#00d97e"];

const ReportTypeDistributionChart = ({ data = [], loading = false }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="w-full h-64 sm:h-56 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1 h-full w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart...</div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No reports for the selected range
          </div>
        )}
      </div>

      <div className="w-full sm:w-44 text-[11px] text-slate-600 space-y-1">
        {hasData
          ? data.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="shrink-0">{item.value}</span>
              </div>
            ))
          : !loading && <div className="text-xs text-slate-500">No distribution available</div>}
      </div>
    </div>
  );
};

export default ReportTypeDistributionChart;
