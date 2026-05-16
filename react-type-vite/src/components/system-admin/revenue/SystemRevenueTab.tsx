import type React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { DollarSign, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import { getSystemRevenue, getSystemRevenueByDateRange } from "@/services/api/superadmin/revenueApi";
import type { SystemRevenueResponse } from "@/services/api/response/revenueResponse";
import DateRangePicker from "@/components/shared/DateRangePicker";
import MonthYearPicker from "@/components/shared/MonthYearPicker";
import { 
  getDateRange, 
  getCurrentMonth, 
  getCurrentYear,
  determineChartGranularity,
  transformRevenueDataByGranularity,
  formatChartLabel,
  getChartTitle,
  type ChartGranularity
} from "@/utils/revenueUtils";

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

  // Calculate chart granularity based on date range
  const chartGranularity = useMemo<ChartGranularity>(() => {
    if (timeRange === "all") {
      return "year";
    }
    
    let startDate: string, endDate: string;
    
    if (timeRange === "custom") {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (timeRange === "select-month" || timeRange === "select-year") {
      const range = getDateRange(timeRange, selectedMonth, selectedYear);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      const range = getDateRange(timeRange);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    return determineChartGranularity(startDate, endDate, timeRange);
  }, [timeRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

  // Transform monthly data based on granularity
  const transformedChartData = useMemo(() => {
    if (!revenueData?.monthlyRevenueDetails) return [];
    
    let startDate: string, endDate: string;
    
    if (timeRange === "custom") {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (timeRange === "select-month" || timeRange === "select-year") {
      const range = getDateRange(timeRange, selectedMonth, selectedYear);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (timeRange === "all") {
      // For "all", use the full range from data
      const months = revenueData.monthlyRevenueDetails.map(d => d.month);
      if (months.length === 0) return [];
      
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      startDate = `${firstMonth}-01`;
      endDate = `${lastMonth}-31`;
    } else {
      const range = getDateRange(timeRange);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    return transformRevenueDataByGranularity(
      revenueData.monthlyRevenueDetails,
      chartGranularity,
      startDate,
      endDate
    );
  }, [revenueData, chartGranularity, timeRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

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
            aria-label="Khoảng thời gian"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Đơn hàng & Items
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Đơn hàng có doanh thu:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {(revenueData.totalOrders || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-blue-200">
                  <span className="text-xs text-gray-600">Không có hoàn tiền:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {Math.max(
                      0,
                      (revenueData.totalOrders || 0) - (revenueData.totalPartiallyRefundedOrders || 0)
                    ).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-yellow-200">
                  <span className="text-xs text-gray-600">Hoàn tiền 1 phần:</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {(revenueData.totalPartiallyRefundedOrders || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-red-200">
                  <span className="text-xs text-gray-600">Hoàn tiền toàn bộ:</span>
                  <span className="text-sm font-semibold text-red-600">
                    {(revenueData.totalFullyRefundedOrders || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Khóa học đã bán:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {(revenueData.totalOrderItems || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Khóa học bị hoàn tiền:</span>
                    <span className="text-sm font-semibold text-red-600">
                      {(revenueData.totalRefundedItems || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {revenueData.totalOrderItems > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Tỷ lệ hoàn tiền:</span>
                      <span className="text-xs font-medium text-orange-600">
                        {((revenueData.totalRefundedItems / revenueData.totalOrderItems) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg ml-4">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {transformedChartData && transformedChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {getChartTitle(chartGranularity)}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={transformedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period"
                tickFormatter={(value) => formatChartLabel(value, chartGranularity)}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) => formatShortCurrency(value)}
                domain={[0, 'auto']}
                width={80}
                label={{ value: 'Doanh thu (VNĐ)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                width={60}
                label={{ value: 'Số đơn', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "Doanh thu tổng") {
                    return [formatCurrency(value), "Doanh thu tổng"];
                  }
                  if (name === "Doanh thu hệ thống (10%)") {
                    return [formatCurrency(value), "Doanh thu hệ thống (10%)"];
                  }
                  if (name === "Đơn hàng có doanh thu") {
                    return [value + " đơn", "Đơn hàng có doanh thu"];
                  }
                  if (name === "Đơn có hoàn tiền") {
                    return [value + " đơn", "Đơn hàng có chứa hoàn tiền"];
                  }
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => formatChartLabel(label, chartGranularity)}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', border: '1px solid #e5e7eb' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => {
                  if (value === "Đơn hàng có doanh thu") return "Đơn hàng (có ≥1 khóa học hợp lệ)";
                  if (value === "Đơn có hoàn tiền") return "Đơn có hoàn tiền (có ≥1 khóa học bị hoàn)";
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="grossRevenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                name="Doanh thu tổng"
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="systemRevenue"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Doanh thu hệ thống (10%)"
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Đơn hàng có doanh thu"
                yAxisId="right"
              />
              <Line
                type="monotone"
                dataKey="refunds"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
                name="Đơn có hoàn tiền"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SystemRevenueTab;
