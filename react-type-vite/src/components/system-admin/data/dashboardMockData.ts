import type {
  DashboardStats,
  ChartDataPoint,
  TimeSeriesData,
} from "@/types/dashboard.types";

// Mock Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  totalUsers: {
    total: 15420,
    students: 8234,
    teachers: 4186,
    learners: 3000,
  },
  trainingUnits: {
    total: 156,
    active: 98,
    pending: 32,
    inactive: 26,
  },
  activeCourses: 1248,
  avgCompletionRate: 72.5,
  weeklyVisits: 45678,
  pendingViolations: 23,
};

// Mock User Growth Data (Last 7 days)
export const mockUserGrowthData: TimeSeriesData[] = [
  { date: "2025-11-21", users: 14200, courses: 1180, visits: 38000 },
  { date: "2025-11-22", users: 14450, courses: 1195, visits: 40200 },
  { date: "2025-11-23", users: 14680, courses: 1210, visits: 41500 },
  { date: "2025-11-24", users: 14890, courses: 1220, visits: 43000 },
  { date: "2025-11-25", users: 15050, courses: 1230, visits: 44200 },
  { date: "2025-11-26", users: 15250, courses: 1240, visits: 45000 },
  { date: "2025-11-27", users: 15420, courses: 1248, visits: 45678 },
];

// Mock User Distribution by Type
export const mockUserDistribution: ChartDataPoint[] = [
  { name: "Sinh viên", value: 8234 },
  { name: "Giảng viên", value: 4186 },
  { name: "Học viên", value: 3000 },
];

// Mock Training Unit Status Distribution
export const mockTrainingUnitDistribution: ChartDataPoint[] = [
  { name: "Đang hoạt động", value: 98 },
  { name: "Chờ duyệt", value: 32 },
  { name: "Không hoạt động", value: 26 },
];

// Mock Course Completion Rate by Category
export const mockCourseCompletionData: ChartDataPoint[] = [
  { name: "Công nghệ thông tin", value: 78 },
  { name: "Kinh doanh", value: 72 },
  { name: "Ngoại ngữ", value: 68 },
  { name: "Thiết kế", value: 75 },
  { name: "Marketing", value: 70 },
  { name: "Khác", value: 65 },
];

// Mock Weekly Visits Data
export const mockWeeklyVisitsData: ChartDataPoint[] = [
  { name: "T2", value: 5800 },
  { name: "T3", value: 6200 },
  { name: "T4", value: 6800 },
  { name: "T5", value: 7100 },
  { name: "T6", value: 7500 },
  { name: "T7", value: 6200 },
  { name: "CN", value: 6078 },
];

// Mock Revenue by Month (Last 6 months)
export const mockRevenueData: ChartDataPoint[] = [
  { name: "Tháng 6", value: 125000000 },
  { name: "Tháng 7", value: 142000000 },
  { name: "Tháng 8", value: 138000000 },
  { name: "Tháng 9", value: 156000000 },
  { name: "Tháng 10", value: 168000000 },
  { name: "Tháng 11", value: 175000000 },
];

// Mock Top Performing Courses
export const mockTopCourses = [
  {
    id: "1",
    name: "Lập trình Web Full-stack",
    students: 1245,
    completionRate: 85,
    revenue: 45000000,
  },
  {
    id: "2",
    name: "Marketing Digital",
    students: 980,
    completionRate: 78,
    revenue: 38000000,
  },
  {
    id: "3",
    name: "Tiếng Anh giao tiếp",
    students: 1520,
    completionRate: 72,
    revenue: 52000000,
  },
  {
    id: "4",
    name: "Data Science & AI",
    students: 856,
    completionRate: 68,
    revenue: 42000000,
  },
  {
    id: "5",
    name: "Quản trị doanh nghiệp",
    students: 745,
    completionRate: 75,
    revenue: 35000000,
  },
];

// Time filter labels
export const TIME_FILTER_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "quarter", label: "Quý này" },
  { value: "year", label: "Năm nay" },
];

// Training unit type options
export const TRAINING_UNIT_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại hình" },
  { value: "university", label: "Trường đại học" },
  { value: "enterprise", label: "Doanh nghiệp" },
  { value: "center", label: "Trung tâm đào tạo" },
];
