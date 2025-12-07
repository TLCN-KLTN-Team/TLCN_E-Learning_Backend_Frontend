// Revenue Types and Interfaces

export type TimeRange = "all" | "today" | "week" | "month" | "year" | "custom" | "select-month" | "select-year";

export interface RevenueTimeFilter {
  range: TimeRange;
  startDate?: string;
  endDate?: string;
}

export const TIME_RANGE_OPTIONS = [
  { value: "all" as const, label: "Tất cả" },
  { value: "today" as const, label: "Hôm nay" },
  { value: "week" as const, label: "Tuần này" },
  { value: "month" as const, label: "Tháng này" },
  { value: "select-month" as const, label: "Chọn tháng" },
  { value: "year" as const, label: "Năm nay" },
  { value: "select-year" as const, label: "Chọn năm" },
  { value: "custom" as const, label: "Tùy chỉnh" },
];

// System Revenue
export interface SystemRevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  chartData: RevenueChartPoint[];
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

// Teacher Revenue
export interface TeacherRevenue {
  id: string;
  name: string;
  avatar?: string;
  totalStudents: number;
  totalRevenue: number;
  courseCount: number;
  averageRating: number;
}

export interface TeacherRevenueData {
  teachers: TeacherRevenue[];
  chartData: { name: string; revenue: number }[];
  topTeachers: TeacherRevenue[];
}

// Course Revenue
export interface CourseRevenue {
  id: string;
  name: string;
  thumbnail?: string;
  teacherName: string;
  totalStudents: number;
  totalRevenue: number;
  price: number;
  category: string;
}

export interface CourseRevenueData {
  courses: CourseRevenue[];
  chartData: { name: string; revenue: number }[];
  topCourses: CourseRevenue[];
}
