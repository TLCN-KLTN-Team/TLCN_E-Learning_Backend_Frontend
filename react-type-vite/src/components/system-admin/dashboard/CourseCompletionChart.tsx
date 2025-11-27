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

interface CourseCompletionChartProps {
  data: ChartDataPoint[];
}

const CourseCompletionChart: React.FC<CourseCompletionChartProps> = ({
  data,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tỷ lệ hoàn thành khóa học theo danh mục
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Legend />
          <Bar
            dataKey="value"
            fill="#8b5cf6"
            name="Tỷ lệ hoàn thành (%)"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CourseCompletionChart;
