// Revenue Types and Interfaces

export type TimeRange = "day" | "week" | "month" | "year";

export interface RevenueTimeFilter {
  range: TimeRange;
  startDate?: string;
  endDate?: string;
}

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

export const TIME_RANGE_OPTIONS = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm nay" },
];
