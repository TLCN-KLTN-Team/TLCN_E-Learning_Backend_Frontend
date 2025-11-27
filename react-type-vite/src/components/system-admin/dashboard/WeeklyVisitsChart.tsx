import type React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";

interface WeeklyVisitsChartProps {
  data: ChartDataPoint[];
}

const WeeklyVisitsChart: React.FC<WeeklyVisitsChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lượt truy cập trong tuần
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => value.toLocaleString("vi-VN")}
          />
          <Legend />
          <Bar
            dataKey="value"
            fill="#f59e0b"
            name="Lượt truy cập"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyVisitsChart;
