import type React from "react";
import { useState } from "react";
import {
  Users,
  Building2,
  BookOpen,
  TrendingUp,
  Eye,
  AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/system-admin/dashboard/StatCard";
import UserGrowthChart from "@/components/system-admin/dashboard/UserGrowthChart";
import WeeklyVisitsChart from "@/components/system-admin/dashboard/WeeklyVisitsChart";
import UserDistributionChart from "@/components/system-admin/dashboard/UserDistributionChart";
import TrainingUnitStatusChart from "@/components/system-admin/dashboard/TrainingUnitStatusChart";
import CourseCompletionChart from "@/components/system-admin/dashboard/CourseCompletionChart";
import DashboardFiltersComponent from "@/components/system-admin/dashboard/DashboardFilters";
import type { DashboardFilters } from "@/types/dashboard.types";
import {
  mockDashboardStats,
  mockUserGrowthData,
  mockWeeklyVisitsData,
  mockUserDistribution,
  mockTrainingUnitDistribution,
  mockCourseCompletionData,
} from "@/components/system-admin/data/dashboardMockData";

const SystemAdminDashboardPage: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    timeFilter: "week",
    trainingUnitType: "all",
  });

  const handleStatClick = (statName: string) => {
    console.log(`Clicked on ${statName} - Navigate to detail page`);
    // TODO: Implement navigation to detail page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tổng quan hệ thống đào tạo
        </h1>
        <p className="text-gray-600 mt-1">
          Theo dõi và quản lý các chỉ số quan trọng của hệ thống
        </p>
      </div>

      {/* Filters */}
      <DashboardFiltersComponent
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Tổng số người dùng"
          value={mockDashboardStats.totalUsers.total.toLocaleString("vi-VN")}
          subtitle={`Sinh viên: ${mockDashboardStats.totalUsers.students.toLocaleString(
            "vi-VN"
          )} | Giảng viên: ${mockDashboardStats.totalUsers.teachers.toLocaleString(
            "vi-VN"
          )}`}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: 12.5, isPositive: true }}
          onClick={() => handleStatClick("users")}
        />

        <StatCard
          title="Đơn vị đào tạo"
          value={mockDashboardStats.trainingUnits.total}
          subtitle={`Hoạt động: ${mockDashboardStats.trainingUnits.active} | Chờ duyệt: ${mockDashboardStats.trainingUnits.pending}`}
          icon={Building2}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: 8.3, isPositive: true }}
          onClick={() => handleStatClick("training-units")}
        />

        <StatCard
          title="Khóa học đang mở"
          value={mockDashboardStats.activeCourses.toLocaleString("vi-VN")}
          subtitle="Các khóa học đang hoạt động"
          icon={BookOpen}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: 15.7, isPositive: true }}
          onClick={() => handleStatClick("courses")}
        />

        <StatCard
          title="Tỷ lệ hoàn thành TB"
          value={`${mockDashboardStats.avgCompletionRate}%`}
          subtitle="Trung bình các khóa học"
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          trend={{ value: 3.2, isPositive: true }}
          onClick={() => handleStatClick("completion-rate")}
        />

        <StatCard
          title="Lượt truy cập tuần"
          value={mockDashboardStats.weeklyVisits.toLocaleString("vi-VN")}
          subtitle="Số lượt truy cập trong 7 ngày"
          icon={Eye}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
          trend={{ value: 7.8, isPositive: true }}
          onClick={() => handleStatClick("visits")}
        />

        <StatCard
          title="Vi phạm chờ xử lý"
          value={mockDashboardStats.pendingViolations}
          subtitle="Nội dung cần kiểm duyệt"
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          trend={{ value: 12.0, isPositive: false }}
          onClick={() => handleStatClick("violations")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="lg:col-span-2">
          <UserGrowthChart data={mockUserGrowthData} />
        </div>

        {/* User Distribution Pie Chart */}
        <UserDistributionChart data={mockUserDistribution} />

        {/* Training Unit Status Chart */}
        <TrainingUnitStatusChart data={mockTrainingUnitDistribution} />

        {/* Weekly Visits Bar Chart */}
        <WeeklyVisitsChart data={mockWeeklyVisitsData} />

        {/* Course Completion Chart */}
        <CourseCompletionChart data={mockCourseCompletionData} />
      </div>
    </div>
  );
};

export default SystemAdminDashboardPage;
