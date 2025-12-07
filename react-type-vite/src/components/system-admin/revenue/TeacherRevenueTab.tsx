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
import { Users, BookOpen, Loader2 } from "lucide-react";
import type { TimeRange } from "@/types/revenue.types";
import { TIME_RANGE_OPTIONS } from "@/types/revenue.types";
import { getAllTeachersRevenue, getAllTeachersRevenueByDateRange, type TeacherRevenueResponse } from "@/services/api/superadmin/revenueApi";
import DateRangePicker from "@/components/shared/DateRangePicker";
import MonthYearPicker from "@/components/shared/MonthYearPicker";
import { getDateRange, getCurrentMonth, getCurrentYear } from "@/utils/revenueUtils";

const TeacherRevenueTab: React.FC = () => {
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
  const [teachersData, setTeachersData] = useState<TeacherRevenueResponse[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: TeacherRevenueResponse[];
        
        if (timeRange === "all") {
          data = await getAllTeachersRevenue();
        } else if (timeRange === "custom") {
          data = await getAllTeachersRevenueByDateRange(customStartDate, customEndDate);
        } else if (timeRange === "select-month" || timeRange === "select-year") {
          const { startDate, endDate } = getDateRange(timeRange, selectedMonth, selectedYear);
          data = await getAllTeachersRevenueByDateRange(startDate, endDate);
        } else {
          const { startDate, endDate } = getDateRange(timeRange);
          data = await getAllTeachersRevenueByDateRange(startDate, endDate);
        }
        
        setTeachersData(data);
        console.log("Teachers Revenue Data:", data);
      } catch (err) {
        console.error("Error loading teachers revenue:", err);
        setError("Không thể tải dữ liệu doanh thu giảng viên");
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

  // Sort teachers by revenue
  const sortedTeachers = [...teachersData].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const topTeachers = sortedTeachers.slice(0, 10);

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

      {/* Top Teachers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Giảng viên có doanh thu cao nhất
        </h3>
        <div className="space-y-4">
          {topTeachers.slice(0, 5).map((teacher, index) => (
            <div
              key={teacher.teacherId || index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {teacher.teacherName || teacher.teacherId || `Teacher ${index + 1}`}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {(teacher.totalStudents || 0).toLocaleString("vi-VN")} học viên
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {teacher.totalCoursesSold || 0} khóa học
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatShortCurrency(teacher.totalRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(teacher.totalRevenue || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      {topTeachers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu giảng viên (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topTeachers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="teacherName"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
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
              <Legend formatter={() => "Doanh thu (70%)"} />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bảng thống kê giảng viên
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
                  Số đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh thu (70%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTeachers.map((teacher, index) => (
                <tr
                  key={teacher.teacherId || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {(teacher.teacherName || teacher.teacherId || "T").charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.teacherName || teacher.teacherId || `Teacher ${index + 1}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.totalCoursesSold || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(teacher.totalStudents || 0).toLocaleString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(teacher.totalOrders || 0).toLocaleString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(teacher.totalRevenue || 0)}
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

export default TeacherRevenueTab;
