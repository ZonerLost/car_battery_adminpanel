import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#00c3ff", "#34C759", "#FF2D55", "#FD6F6C"];

const CarCoverageChart = ({ data = [], loading = false }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => Number.isFinite(item?.value));
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + Number(item.value || 0), 0), [chartData]);

  const displayData = useMemo(
    () =>
      chartData.map((item) => ({
        ...item,
        percent: total ? Math.round((Number(item.value) / total) * 100) : 0,
      })),
    [chartData, total]
  );

  const hasData = displayData.length > 0 && total > 0;

  return (
    <div className="w-full h-64 sm:h-56 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1 h-full w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart...</div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {displayData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No data for the selected range
          </div>
        )}
      </div>

      <div className="w-full sm:w-40 text-[11px] text-slate-600 space-y-1">
        {hasData
          ? displayData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="shrink-0">{item.percent}%</span>
              </div>
            ))
          : !loading && <div className="text-xs text-slate-500">No coverage breakdown</div>}
      </div>
    </div>
  );
};

export default CarCoverageChart;
