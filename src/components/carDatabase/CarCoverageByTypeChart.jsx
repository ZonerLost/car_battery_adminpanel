import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#00c3ff", "#00d97e", "#ff9f1c", "#ff5a5f"];

const CarCoverageByTypeChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center text-xs text-slate-500">
        No data for selected filters
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex items-center justify-center">
      <div className="flex-1 w-full min-w-0">
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <PieChart>
            <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CarCoverageByTypeChart;
