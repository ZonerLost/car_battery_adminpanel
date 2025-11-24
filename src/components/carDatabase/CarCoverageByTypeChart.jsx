import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Sedan", value: 35 },
  { name: "SUV", value: 32 },
  { name: "Pickup", value: 18 },
  { name: "Other", value: 15 },
];

const COLORS = ["#00c3ff", "#00d97e", "#ff9f1c", "#ff5a5f"];

const CarCoverageByTypeChart = () => {
  return (
    <div className="w-full h-64 sm:h-56 flex items-center justify-center">
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
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CarCoverageByTypeChart;
