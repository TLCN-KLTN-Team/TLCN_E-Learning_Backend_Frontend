import type React from "react";
import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  BookOpen,
  TrendingUp,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/system-admin/dashboard/StatCard";
import UserGrowthChart from "@/components/system-admin/dashboard/UserGrowthChart";
import WeeklyVisitsChart from "@/components/system-admin/dashboard/WeeklyVisitsChart";
import UserDistributionChart from "@/components/system-admin/dashboard/UserDistributionChart";
import TrainingUnitStatusChart from "@/components/system-admin/dashboard/TrainingUnitStatusChart";
import CourseCompletionChart from "@/components/system-admin/dashboard/CourseCompletionChart";
import DashboardFiltersComponent from "@/components/system-admin/dashboard/DashboardFilters";
import type {
  DashboardFilters,
  DashboardResponse,
} from "@/types/dashboard.types";
import { PeriodType, EducationType } from "@/types/dashboard.types";
import {
  mockUserGrowthData,
  mockWeeklyVisitsData,
  mockUserDistribution,
  mockTrainingUnitDistribution,
  mockCourseCompletionData,
} from "@/components/system-admin/data/dashboardMockData";
import DashboardApiService from "@/services/api/superadmin/dashboard.api";
import { toast } from "react-toastify";

const SystemAdminDashboardPage: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    timeFilter: "month",
    trainingUnitType: "all",
  });
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Map UI filters to backend enums
  const mapTimeFilterToPeriodType = (timeFilter: string): PeriodType => {
    switch (timeFilter) {
      case "week":
        return PeriodType.WEEK;
      case "month":
        return PeriodType.MONTH;
      case "year":
        return PeriodType.YEAR;
      default:
        return PeriodType.MONTH;
    }
  };

  const mapTrainingUnitToEducationType = (type: string): EducationType => {
    switch (type) {
      case "university":
        return EducationType.UNIVERSITY;
      case "enterprise":
        return EducationType.COLLEGE;
      case "center":
        return EducationType.INTERMEDIATE;
      default:
        return EducationType.ALL;
    }
  };

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const periodType = mapTimeFilterToPeriodType(filters.timeFilter);
        const educationType = mapTrainingUnitToEducationType(
          filters.trainingUnitType
        );

        const data = await DashboardApiService.getDashboardStatistics(
          periodType,
          educationType
        );

        console.log("Dashboard API Response:", data);
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters]);

  const handleStatClick = (statName: string) => {
    console.log(`Clicked on ${statName} - Navigate to detail page`);
    // TODO: Implement navigation to detail page
  };

  // Helper function to safely get value with fallback
  const safeValue = (
    value: number | undefined | null,
    defaultValue: number = 0
  ): number => {
    return value ?? defaultValue;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

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
          value={safeValue(
            dashboardData.userStatistics?.totalUsers
          ).toLocaleString("vi-VN")}
          subtitle={`Sinh viên: ${safeValue(
            dashboardData.userStatistics?.studentCount
          ).toLocaleString("vi-VN")} | Giảng viên: ${safeValue(
            dashboardData.userStatistics?.teacherCount
          ).toLocaleString("vi-VN")}`}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{
            value: Math.abs(
              safeValue(dashboardData.userStatistics?.growthRate)
            ),
            isPositive:
              safeValue(dashboardData.userStatistics?.growthRate) >= 0,
          }}
          onClick={() => handleStatClick("users")}
        />

        <StatCard
          title="Đơn vị đào tạo"
          value={safeValue(
            dashboardData.organizationStatistics?.totalOrganizations
          )}
          subtitle={`Hoạt động: ${safeValue(
            dashboardData.organizationStatistics?.activeOrganizations
          )} | Không hoạt động: ${safeValue(
            dashboardData.organizationStatistics?.inactiveOrganizations
          )}`}
          icon={Building2}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{
            value: Math.abs(
              safeValue(dashboardData.organizationStatistics?.growthRate)
            ),
            isPositive:
              safeValue(dashboardData.organizationStatistics?.growthRate) >= 0,
          }}
          onClick={() => handleStatClick("training-units")}
        />

        <StatCard
          title="Khóa học đang mở"
          value={safeValue(
            dashboardData.activeCourses?.currentValue
          ).toLocaleString("vi-VN")}
          subtitle={`Trước đó: ${safeValue(
            dashboardData.activeCourses?.previousValue
          ).toLocaleString("vi-VN")} khóa học`}
          icon={BookOpen}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{
            value: Math.abs(safeValue(dashboardData.activeCourses?.growthRate)),
            isPositive: safeValue(dashboardData.activeCourses?.growthRate) >= 0,
          }}
          onClick={() => handleStatClick("courses")}
        />

        <StatCard
          title="Tỷ lệ hoàn thành TB"
          value={`${safeValue(
            dashboardData.completionRate?.currentValue
          ).toFixed(1)}%`}
          subtitle="Trung bình các khóa học"
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          trend={{
            value: Math.abs(
              safeValue(dashboardData.completionRate?.growthRate)
            ),
            isPositive:
              safeValue(dashboardData.completionRate?.growthRate) >= 0,
          }}
          onClick={() => handleStatClick("completion-rate")}
        />

        <StatCard
          title="Lượt truy cập"
          value={safeValue(
            dashboardData.weeklyTraffic?.currentValue
          ).toLocaleString("vi-VN")}
          subtitle={`Trước đó: ${safeValue(
            dashboardData.weeklyTraffic?.previousValue
          ).toLocaleString("vi-VN")}`}
          icon={Eye}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
          trend={{
            value: Math.abs(safeValue(dashboardData.weeklyTraffic?.growthRate)),
            isPositive: safeValue(dashboardData.weeklyTraffic?.growthRate) >= 0,
          }}
          onClick={() => handleStatClick("visits")}
        />

        <StatCard
          title="Vi phạm chờ xử lý"
          value={safeValue(dashboardData.pendingViolations?.currentValue)}
          subtitle={`Trước đó: ${safeValue(
            dashboardData.pendingViolations?.previousValue
          )} vi phạm`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          trend={{
            value: Math.abs(
              safeValue(dashboardData.pendingViolations?.growthRate)
            ),
            isPositive:
              safeValue(dashboardData.pendingViolations?.growthRate) <= 0,
          }}
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
