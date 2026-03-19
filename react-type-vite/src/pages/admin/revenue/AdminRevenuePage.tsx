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
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { getAdminRevenue, getAdminRevenueByDateRange } from "@/services/api/admin/revenueApi";
import type { AdminRevenueResponse } from "@/services/api/response/revenueResponse";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
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
  type ChartGranularity,
} from "@/utils/revenueUtils";

interface AdminRevenueData {
  totalRevenue: number;
  totalAccrued: number;
  totalSettled: number;
  totalPending: number;
  totalCourses: number;
  totalTeachers: number;
  totalStudents: number;
  totalOrders: number;
  sharePercentage: number;
  educationalUnitName: string;
  educationalUnitId: string;
  teacherRevenueDetails: TeacherRevenueDetail[];
  monthlyRevenueDetails: MonthlyRevenueDetail[];
}

interface TeacherRevenueDetail {
  teacherId: string;
  teacherName: string;
  revenue: number;
  courseCount: number;
  studentCount: number;
  averageRating: number;
}

interface MonthlyRevenueDetail {
  month: string;
  revenue: number;
  orderCount: number;
}

const AdminRevenuePage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<AdminRevenueData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const chartGranularity = useMemo<ChartGranularity>(() => {
    if (timeRange === "all") {
      return "year";
    }

    let startDate: string;
    let endDate: string;

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

  const transformedChartData = useMemo(() => {
    if (!revenueData?.monthlyRevenueDetails) return [];

    let startDate: string;
    let endDate: string;

    if (timeRange === "custom") {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (timeRange === "select-month" || timeRange === "select-year") {
      const range = getDateRange(timeRange, selectedMonth, selectedYear);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (timeRange === "all") {
      const months = revenueData.monthlyRevenueDetails.map((d) => d.month);
      if (months.length === 0) return [];
      startDate = `${months[0]}-01`;
      endDate = `${months[months.length - 1]}-31`;
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
    fetchRevenueData();
  }, [timeRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response: AdminRevenueResponse;

      if (timeRange === "all") {
        response = await getAdminRevenue();
      } else if (timeRange === "custom") {
        response = await getAdminRevenueByDateRange(customStartDate, customEndDate);
      } else if (timeRange === "select-month" || timeRange === "select-year") {
        const { startDate, endDate } = getDateRange(timeRange, selectedMonth, selectedYear);
        response = await getAdminRevenueByDateRange(startDate, endDate);
      } else {
        const { startDate, endDate } = getDateRange(timeRange);
        response = await getAdminRevenueByDateRange(startDate, endDate);
      }

      console.log("=== ADMIN REVENUE DATA DEBUG ===");
      console.log("Time range:", timeRange);
      console.log("Full response:", response);
      console.log("Teacher details:", response.teacherRevenueDetails);
      console.log("Monthly details:", response.monthlyRevenueDetails);
      console.log("Stats:", {
        totalRevenue: response.totalRevenue,
        totalAccrued: response.totalAccrued,
        totalSettled: response.totalSettled,
        totalTeachers: response.totalTeachers,
        totalCourses: response.totalCourses,
        totalStudents: response.totalStudents
      });
      console.log("===============================");
      setRevenueData(response);
    } catch (err) {
      handleError(err);
      setError("Không thể tải dữ liệu doanh thu");
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

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
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString(); // Show actual value if less than 1000
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <div className="text-lg text-gray-900 font-semibold mb-2">Lỗi tải dữ liệu</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          onClick={fetchRevenueData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Doanh thu đơn vị đào tạo
            </h1>
            <p className="text-gray-600 mt-1">
              {revenueData.educationalUnitName} - Theo dõi doanh thu từ các khóa học
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Chọn khoảng thời gian"
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
          <div className="flex justify-end">
            <MonthYearPicker
              mode="month"
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>
        )}

        {/* Year Picker */}
        {timeRange === "select-year" && (
          <div className="flex justify-end">
            <MonthYearPicker
              mode="year"
              value={selectedYear}
              onChange={setSelectedYear}
            />
          </div>
        )}

        {/* Custom Date Range Picker */}
        {timeRange === "custom" && (
          <div className="flex justify-end">
            <DateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onStartDateChange={setCustomStartDate}
              onEndDateChange={setCustomEndDate}
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng doanh thu đơn vị
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(revenueData.totalRevenue)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalRevenue)}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {revenueData.sharePercentage}% chiết khấu từ hệ thống
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Chờ thanh toán
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(revenueData.totalAccrued)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalAccrued)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
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
                {formatShortCurrency(revenueData.totalSettled)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalSettled)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Thống kê</p>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-900">
                  <Users className="w-4 h-4 inline mr-1" />
                  {revenueData.totalStudents} học viên
                </p>
                <p className="text-sm text-gray-900">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  {revenueData.totalTeachers} giảng viên
                </p>
                <p className="text-sm text-gray-900">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  {revenueData.totalCourses} khóa học
                </p>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
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
              tickFormatter={(value) => formatShortCurrency(value)}
              width={80}
              domain={[0, 'auto']}
            />
            <Tooltip
              labelFormatter={(value) => formatChartLabel(value, chartGranularity)}
              formatter={(value: number, name: string) => {
                if (name === "Doanh thu") {
                  return [formatCurrency(value), "Doanh thu"];
                }
                if (name === "Đơn hàng") {
                  return [`${value} đơn`, "Đơn hàng"];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              name="Doanh thu"
            />
            <Line
              type="monotone"
              dataKey="orderCount"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Đơn hàng"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Teachers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top giảng viên theo doanh thu
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData.teacherRevenueDetails}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="teacherName" />
            <YAxis
              tickFormatter={(value) => formatShortCurrency(value)}
              width={80}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(value: number) => [
                formatCurrency(value),
                "Doanh thu",
              ]}
            />
            <Legend formatter={() => "Doanh thu giảng viên"} />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Teacher Details Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết doanh thu theo giảng viên
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số khóa học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đánh giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh thu giảng viên
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.teacherRevenueDetails.map((teacher) => (
                <tr
                  key={teacher.teacherId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {teacher.teacherName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.teacherName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.courseCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.studentCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-yellow-600 font-semibold">
                        ⭐ {teacher.averageRating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(teacher.revenue)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenuePage;
