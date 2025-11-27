import type React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesData } from "@/types/dashboard.types";

interface UserGrowthChartProps {
  data: TimeSeriesData[];
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tăng trưởng người dùng và khóa học
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${
                date.getMonth() + 1
              }/${date.getFullYear()}`;
            }}
            formatter={(value: number) => value.toLocaleString("vi-VN")}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Người dùng"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="courses"
            stroke="#10b981"
            strokeWidth={2}
            name="Khóa học"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;
