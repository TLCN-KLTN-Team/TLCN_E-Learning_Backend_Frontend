import type React from "react";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";
import DashboardApiService from "@/services/api/superadmin/dashboard.api";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const UserDistributionChart: React.FC = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserDistribution = async () => {
      try {
        setLoading(true);
        const response = await DashboardApiService.getUserDistribution();

        const chartData: ChartDataPoint[] = [
          { name: "Người dùng", value: response.totalUsers },
          { name: "Giảng viên", value: response.instructorUsers },
          { name: "Học viên", value: response.studentUsers },
        ];

        setData(chartData);
        console.log("User Distribution Data:", chartData);
      } catch (error) {
        console.error("Error fetching user distribution:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu phân bố người dùng",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDistribution();
  }, [toast]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phân bố người dùng theo loại
        </h3>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Phân bố người dùng theo loại
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${((percent || 0) * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => value.toLocaleString("vi-VN")}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserDistributionChart;
