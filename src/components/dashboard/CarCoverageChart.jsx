import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

// static sample data — later replace with API data
const data = [
  { name: "Sedan", value: 35 },
  { name: "SUV", value: 30 },
  { name: "Pickup", value: 20 },
  { name: "Other", value: 15 },
];

const COLORS = ["#00c3ff", "#34C759 ", "#FF2D55", "#FD6F6C"];

const CarCoverageChart = () => {
  return (
    <div className="w-full h-64 sm:h-56 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1 h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-32 text-[11px] text-slate-600 space-y-1">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="shrink-0">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarCoverageChart;
