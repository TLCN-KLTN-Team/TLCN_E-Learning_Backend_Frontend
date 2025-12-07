import type React from "react";
import { useState, useEffect } from "react";
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
import { DollarSign, ShoppingCart, TrendingUp, Loader2, Users } from "lucide-react";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import { getSystemRevenue, getSystemRevenueByDateRange, type SystemRevenueResponse } from "@/services/api/superadmin/revenueApi";
import DateRangePicker from "@/components/shared/DateRangePicker";
import MonthYearPicker from "@/components/shared/MonthYearPicker";
import { getDateRange, getCurrentMonth, getCurrentYear } from "@/utils/revenueUtils";

const SystemRevenueTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<SystemRevenueResponse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: SystemRevenueResponse;
        
        if (timeRange === "all") {
          // Fetch all data without date range
          data = await getSystemRevenue();
        } else if (timeRange === "custom") {
          // Use custom date range
          data = await getSystemRevenueByDateRange(customStartDate, customEndDate);
        } else if (timeRange === "select-month" || timeRange === "select-year") {
          const { startDate, endDate } = getDateRange(timeRange, selectedMonth, selectedYear);
          data = await getSystemRevenueByDateRange(startDate, endDate);
        } else {
          // Calculate date range for predefined options
          const { startDate, endDate } = getDateRange(timeRange);
          data = await getSystemRevenueByDateRange(startDate, endDate);
        }
        
        setRevenueData(data);
        console.log("System Revenue Data:", data);
      } catch (err) {
        console.error("Error loading system revenue:", err);
        setError("Không thể tải dữ liệu doanh thu hệ thống");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timeRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value < 1000) return value.toString();
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
        <div>
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
        
        {/* Month Picker */}
        {timeRange === "select-month" && (
          <MonthYearPicker
            mode="month"
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        )}
        
        {/* Year Picker */}
        {timeRange === "select-year" && (
          <MonthYearPicker
            mode="year"
            value={selectedYear}
            onChange={setSelectedYear}
          />
        )}
        
        {/* Custom Date Range Picker */}
        {timeRange === "custom" && (
          <DateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng doanh thu (10%)
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(revenueData.totalRevenue || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalRevenue || 0)}
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
                Đã thanh toán
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(revenueData.totalSettled || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalSettled || 0)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng học viên
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {(revenueData.totalStudents || 0).toLocaleString("vi-VN")}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Trên toàn hệ thống</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng đơn hàng
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {(revenueData.totalOrders || 0).toLocaleString("vi-VN")}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Giao dịch thành công</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueData.monthlyRevenueDetails && revenueData.monthlyRevenueDetails.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData.monthlyRevenueDetails}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => formatShortCurrency(value)}
                domain={[0, 'auto']}
                width={80}
              />
              <Tooltip
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
                dataKey="orderCount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SystemRevenueTab;
