"use client";

import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getSystemRevenue,
  getAllTeachersRevenue,
  getAllCoursesRevenue,
} from "../../services/api/superadmin/revenueApi";
import type {
  SystemRevenueResponse,
  TeacherRevenueResponse,
  CourseRevenueDetail,
} from "@/services/api/response/revenueResponse";

type TabType = "system" | "teachers" | "courses";

const RevenueManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("system");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // System revenue data
  const [systemRevenue, setSystemRevenue] = useState<SystemRevenueResponse | null>(null);

  // Teachers revenue data
  const [teachersRevenue, setTeachersRevenue] = useState<TeacherRevenueResponse[]>([]);

  // Courses revenue data
  const [coursesRevenue, setCoursesRevenue] = useState<CourseRevenueDetail[]>([]);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === "system") {
          const data = await getSystemRevenue();
          setSystemRevenue(data);
          console.log("System Revenue:", data);
        } else if (activeTab === "teachers") {
          const data = await getAllTeachersRevenue();
          setTeachersRevenue(data);
          console.log("Teachers Revenue:", data);
        } else if (activeTab === "courses") {
          const data = await getAllCoursesRevenue();
          setCoursesRevenue(data);
          console.log("Courses Revenue:", data);
        }
      } catch (err) {
        console.error("Error loading revenue data:", err);
        setError("Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
  };

  const formatShortCurrency = (value: number): string => {
    if (value < 1000) return value.toString();
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return `${(value / 1000).toFixed(0)}K`;
  };

  const headerStyles =
    "px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider";

  // Tab buttons
  const tabs: { key: TabType; label: string }[] = [
    { key: "system", label: "Hệ thống" },
    { key: "teachers", label: "Giảng viên" },
    { key: "courses", label: "Khóa học" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quản lý Doanh thu
        </h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  py-4 px-6 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && activeTab === "system" && systemRevenue && (
            <SystemRevenueTab data={systemRevenue} formatCurrency={formatCurrency} formatShortCurrency={formatShortCurrency} />
          )}

          {!loading && !error && activeTab === "teachers" && (
            <TeachersRevenueTab data={teachersRevenue} formatCurrency={formatCurrency} headerStyles={headerStyles} />
          )}

          {!loading && !error && activeTab === "courses" && (
            <CoursesRevenueTab data={coursesRevenue} formatCurrency={formatCurrency} headerStyles={headerStyles} />
          )}
        </div>
      </div>
    </div>
  );
};

// System Revenue Tab Component
const SystemRevenueTab: React.FC<{
  data: SystemRevenueResponse;
  formatCurrency: (value: number) => string;
  formatShortCurrency: (value: number) => string;
}> = ({ data, formatCurrency, formatShortCurrency }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Phí nền tảng ({data.sharePercentage ?? 10}%)
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã thanh toán</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.totalSettled)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng học viên</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.totalStudents.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.totalOrders.toLocaleString()}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {data.monthlyRevenueDetails && data.monthlyRevenueDetails.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyRevenueDetails}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatShortCurrency} domain={[0, 'auto']} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                name="Doanh thu"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// Teachers Revenue Tab Component
const TeachersRevenueTab: React.FC<{
  data: TeacherRevenueResponse[];
  formatCurrency: (value: number) => string;
  headerStyles: string;
}> = ({ data, formatCurrency, headerStyles }) => {
  // Sort teachers by revenue
  const sortedTeachers = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const topTeachers = sortedTeachers.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Teachers Chart */}
      {topTeachers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 giảng viên theo doanh thu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTeachers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="teacherName"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#3b82f6" name="Doanh thu (70%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết doanh thu giảng viên
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerStyles}>Giảng viên</th>
                <th className={headerStyles}>Doanh thu (70%)</th>
                <th className={headerStyles}>Số khóa học</th>
                <th className={headerStyles}>Số đơn hàng</th>
                <th className={headerStyles}>Số học viên</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTeachers.map((teacher, index) => (
                <tr key={teacher.teacherId || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {teacher.teacherName || teacher.teacherId || `Teacher ${index + 1}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {formatCurrency(teacher.totalRevenue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.totalCoursesSold}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.totalOrders}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.totalStudents}
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

// Courses Revenue Tab Component
const CoursesRevenueTab: React.FC<{
  data: CourseRevenueDetail[];
  formatCurrency: (value: number) => string;
  headerStyles: string;
}> = ({ data, formatCurrency, headerStyles }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  // Sort courses by revenue
  const sortedCourses = [...data].sort((a, b) => b.revenue - a.revenue);
  const topCourses = sortedCourses.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Courses Chart */}
      {topCourses.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 khóa học theo doanh thu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCourses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết doanh thu khóa học
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerStyles}>Khóa học</th>
                <th className={headerStyles}>Doanh thu</th>
                <th className={headerStyles}>Số lượng bán</th>
                <th className={headerStyles}>Số học viên</th>
                <th className={headerStyles}>Đánh giá TB</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCourses.map((course) => (
                <tr key={course.courseId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {course.courseThumbnail && (
                        <img
                          src={course.courseThumbnail}
                          alt={course.courseName}
                          className="w-12 h-12 rounded object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {course.courseName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(course.revenue)}
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
                    <div className="text-sm text-yellow-600">
                      ⭐ {course.averageRating.toFixed(1)}
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

export default RevenueManagement;
