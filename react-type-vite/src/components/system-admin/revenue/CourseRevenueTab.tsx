import type React from "react";
import { useState, useEffect } from "react";
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
import { Users, Loader2, Star } from "lucide-react";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import { getAllCoursesRevenue, getAllCoursesRevenueByDateRange } from "@/services/api/superadmin/revenueApi";
import type { CourseRevenueDetail } from "@/services/api/response/revenueResponse";
import DateRangePicker from "@/components/shared/DateRangePicker";
import MonthYearPicker from "@/components/shared/MonthYearPicker";
import { getDateRange, getCurrentMonth, getCurrentYear } from "@/utils/revenueUtils";

const CourseRevenueTab: React.FC = () => {
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
  const [coursesData, setCoursesData] = useState<CourseRevenueDetail[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: CourseRevenueDetail[];

        if (timeRange === "all") {
          data = await getAllCoursesRevenue();
        } else if (timeRange === "custom") {
          data = await getAllCoursesRevenueByDateRange(customStartDate, customEndDate);
        } else if (timeRange === "select-month" || timeRange === "select-year") {
          const { startDate, endDate } = getDateRange(timeRange, selectedMonth, selectedYear);
          data = await getAllCoursesRevenueByDateRange(startDate, endDate);
        } else {
          const { startDate, endDate } = getDateRange(timeRange);
          data = await getAllCoursesRevenueByDateRange(startDate, endDate);
        }

        setCoursesData(data);
        console.log("Courses Revenue Data:", data);
      } catch (err) {
        console.error("Error loading courses revenue:", err);
        setError("Không thể tải dữ liệu doanh thu khóa học");
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

  // Sort courses by revenue
  const sortedCourses = [...coursesData].sort((a, b) => b.revenue - a.revenue);
  const topCourses = sortedCourses.slice(0, 10);

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

      {/* Top Courses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Khóa học có doanh thu cao nhất
        </h3>
        <div className="space-y-4">
          {topCourses.slice(0, 5).map((course, index) => (
            <div
              key={course.courseId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold">
                  #{index + 1}
                </div>
                {course.courseThumbnail && (
                  <img
                    src={course.courseThumbnail}
                    alt={course.courseName}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{course.courseName}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {(course.totalStudents || 0).toLocaleString("vi-VN")} học viên
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {(course.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-green-600">
                  {formatShortCurrency(course.revenue || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(course.revenue || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      {topCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu khóa học (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topCourses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="courseName"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatShortCurrency(value)}
                domain={[0, 'auto']}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Doanh thu",
                ]}
              />
              <Legend formatter={() => "Doanh thu"} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bảng thống kê khóa học
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên khóa học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng bán
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
              {sortedCourses.map((course) => (
                <tr
                  key={course.courseId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {course.courseThumbnail && (
                        <img
                          src={course.courseThumbnail}
                          alt={course.courseName}
                          className="w-12 h-12 rounded object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 max-w-xs">
                        {course.courseName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(course.totalStudents || 0).toLocaleString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(course.totalSales || 0).toLocaleString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-900">
                        {(course.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(course.revenue || 0)}
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

export default CourseRevenueTab;
