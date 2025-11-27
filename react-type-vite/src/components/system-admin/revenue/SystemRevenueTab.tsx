import type React from "react";
import { useState } from "react";
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
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import { mockSystemRevenueData } from "../data/revenueMockData";

const SystemRevenueTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Khoảng thời gian
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng doanh thu
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(mockSystemRevenueData.totalRevenue)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(mockSystemRevenueData.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Số lượng đơn hàng
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {mockSystemRevenueData.totalOrders.toLocaleString("vi-VN")}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Giao dịch thành công</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Giá trị TB/Đơn hàng
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(mockSystemRevenueData.averageOrderValue)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(mockSystemRevenueData.averageOrderValue)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Biểu đồ doanh thu theo thời gian
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mockSystemRevenueData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              tickFormatter={(value) => formatShortCurrency(value)}
              width={80}
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${
                  date.getMonth() + 1
                }/${date.getFullYear()}`;
              }}
              formatter={(value: number, name: string) => {
                if (name === "revenue") {
                  return [formatCurrency(value), "Doanh thu"];
                }
                return [value, "Đơn hàng"];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === "revenue") return "Doanh thu";
                return "Đơn hàng";
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemRevenueTab;
