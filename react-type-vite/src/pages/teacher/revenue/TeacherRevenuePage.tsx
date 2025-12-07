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
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getTeacherRevenue, getTeacherRevenueByDateRange, type TeacherRevenueResponse } from "@/services/api/teacher/revenueApi";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import DateRangePicker from "@/components/shared/DateRangePicker";
import MonthYearPicker from "@/components/shared/MonthYearPicker";

// Helper function to calculate date range
const getDateRange = (range: TimeRange, selectedMonth?: string, selectedYear?: string): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case "today":
      // Same day
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(start.getDate() - 30);
      break;
    case "select-month":
      if (selectedMonth) {
        // selectedMonth format: "yyyy-MM"
        const [year, month] = selectedMonth.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0]
        };
      }
      break;
    case "year":
      start.setDate(start.getDate() - 365);
      break;
    case "select-year":
      if (selectedYear) {
        // selectedYear format: "yyyy"
        const yearStart = new Date(parseInt(selectedYear), 0, 1);
        const yearEnd = new Date(parseInt(selectedYear), 11, 31);
        return {
          startDate: yearStart.toISOString().split('T')[0],
          endDate: yearEnd.toISOString().split('T')[0]
        };
      }
      break;
    case "all":
    case "custom":
    default:
      // For "all" or "custom", handled separately
      break;
  }
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
};

interface TeacherRevenueData {
  totalRevenue: number;
  totalAccrued: number;
  totalSettled: number;
  totalPending: number;
  totalCoursesSold: number;
  totalStudents: number;
  totalOrders: number;
  sharePercentage: number;
  courseRevenueDetails: CourseRevenueDetail[];
  monthlyRevenueDetails: MonthlyRevenueDetail[];
}

interface CourseRevenueDetail {
  courseId: string;
  courseName: string;
  courseThumbnail: string;
  revenue: number;
  totalSales: number;
  totalStudents: number;
  averageRating: number;
}

interface MonthlyRevenueDetail {
  month: string;
  revenue: number;
  orderCount: number;
}

const TeacherRevenuePage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<TeacherRevenueData | null>(
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
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // "yyyy-MM"
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString() // "yyyy"
  );
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange, customStartDate, customEndDate, selectedMonth, selectedYear]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response: TeacherRevenueResponse;
      
      if (timeRange === "all") {
        response = await getTeacherRevenue();
      } else if (timeRange === "custom") {
        response = await getTeacherRevenueByDateRange(customStartDate, customEndDate);
      } else if (timeRange === "select-month" || timeRange === "select-year") {
        const { startDate, endDate } = getDateRange(timeRange, selectedMonth, selectedYear);
        response = await getTeacherRevenueByDateRange(startDate, endDate);
      } else {
        const { startDate, endDate } = getDateRange(timeRange);
        response = await getTeacherRevenueByDateRange(startDate, endDate);
      }
      
      console.log("=== REVENUE DATA DEBUG ===");
      console.log("Time range:", timeRange);
      console.log("Full response:", response);
      console.log("Course details:", response.courseRevenueDetails);
      console.log("Monthly details:", response.monthlyRevenueDetails);
      console.log("========================");
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
            <h1 className="text-2xl font-bold text-gray-900">Doanh thu của tôi</h1>
            <p className="text-gray-600 mt-1">
              Theo dõi doanh thu từ các khóa học của bạn
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
                Tổng doanh thu
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(revenueData.totalRevenue)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-2">
                {revenueData.sharePercentage}% của tổng giá trị khóa học
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
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Số học viên
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {revenueData.totalStudents}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {revenueData.totalOrders} đơn hàng
              </p>
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
          Biểu đồ doanh thu theo tháng
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={revenueData.monthlyRevenueDetails}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                return `${month}/${year}`;
              }}
            />
            <YAxis
              tickFormatter={(value) => formatShortCurrency(value)}
              width={80}
              domain={[0, 'auto']}
            />
            <Tooltip
              labelFormatter={(value) => {
                const [year, month] = value.split("-");
                return `Tháng ${month}/${year}`;
              }}
              formatter={(value: number, name: string) => {
                if (name === "revenue") {
                  return [formatCurrency(value), "Doanh thu"];
                }
                return [value, name === "orders" ? "Đơn hàng" : "Học viên"];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === "revenue") return "Doanh thu";
                if (value === "orders") return "Đơn hàng";
                return "Học viên";
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

      {/* Top Courses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Khóa học bán chạy nhất
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData.courseRevenueDetails}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="courseName"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
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
            <Legend formatter={() => "Doanh thu"} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Course Details Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết doanh thu theo khóa học
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khóa học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đánh giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.courseRevenueDetails.map((course) => (
                <tr
                  key={course.courseId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseName}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {course.courseName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.totalSales}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.totalStudents}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-yellow-600 font-semibold">
                        ⭐ {course.averageRating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(course.revenue)}
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

export default TeacherRevenuePage;
