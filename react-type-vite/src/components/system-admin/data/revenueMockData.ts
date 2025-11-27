import type {
  SystemRevenueData,
  TeacherRevenueData,
  CourseRevenueData,
  TeacherRevenue,
  CourseRevenue,
} from "@/types/revenue.types";

// Mock System Revenue Data
export const mockSystemRevenueData: SystemRevenueData = {
  totalRevenue: 2450000000, // 2.45 tỷ VNĐ
  totalOrders: 8934,
  averageOrderValue: 274200, // 274,200 VNĐ
  chartData: [
    { date: "2025-11-01", revenue: 75000000, orders: 285 },
    { date: "2025-11-05", revenue: 82000000, orders: 310 },
    { date: "2025-11-10", revenue: 95000000, orders: 340 },
    { date: "2025-11-15", revenue: 88000000, orders: 325 },
    { date: "2025-11-20", revenue: 105000000, orders: 380 },
    { date: "2025-11-25", revenue: 98000000, orders: 360 },
    { date: "2025-11-28", revenue: 112000000, orders: 395 },
  ],
};

// Mock Teacher Revenue Data
const mockTeachers: TeacherRevenue[] = [
  {
    id: "T001",
    name: "Nguyễn Văn An",
    totalStudents: 2450,
    totalRevenue: 485000000,
    courseCount: 12,
    averageRating: 4.8,
  },
  {
    id: "T002",
    name: "Trần Thị Bình",
    totalStudents: 1980,
    totalRevenue: 392000000,
    courseCount: 8,
    averageRating: 4.7,
  },
  {
    id: "T003",
    name: "Lê Hoàng Cường",
    totalStudents: 1750,
    totalRevenue: 345000000,
    courseCount: 10,
    averageRating: 4.6,
  },
  {
    id: "T004",
    name: "Phạm Thị Dung",
    totalStudents: 1620,
    totalRevenue: 318000000,
    courseCount: 7,
    averageRating: 4.9,
  },
  {
    id: "T005",
    name: "Hoàng Văn Em",
    totalStudents: 1450,
    totalRevenue: 285000000,
    courseCount: 9,
    averageRating: 4.5,
  },
  {
    id: "T006",
    name: "Vũ Thị Phương",
    totalStudents: 1280,
    totalRevenue: 252000000,
    courseCount: 6,
    averageRating: 4.7,
  },
  {
    id: "T007",
    name: "Đỗ Văn Giang",
    totalStudents: 1150,
    totalRevenue: 225000000,
    courseCount: 8,
    averageRating: 4.4,
  },
  {
    id: "T008",
    name: "Bùi Thị Hương",
    totalStudents: 980,
    totalRevenue: 192000000,
    courseCount: 5,
    averageRating: 4.8,
  },
];

export const mockTeacherRevenueData: TeacherRevenueData = {
  teachers: mockTeachers,
  chartData: mockTeachers.slice(0, 10).map((t) => ({
    name: t.name,
    revenue: t.totalRevenue,
  })),
  topTeachers: mockTeachers.slice(0, 5),
};

// Mock Course Revenue Data
const mockCourses: CourseRevenue[] = [
  {
    id: "C001",
    name: "Lập trình Web Full-stack từ cơ bản đến nâng cao",
    teacherName: "Nguyễn Văn An",
    totalStudents: 1245,
    totalRevenue: 186750000,
    price: 150000,
    category: "Công nghệ thông tin",
  },
  {
    id: "C002",
    name: "Marketing Digital hiệu quả",
    teacherName: "Trần Thị Bình",
    totalRevenue: 147000000,
    totalStudents: 980,
    price: 150000,
    category: "Marketing",
  },
  {
    id: "C003",
    name: "Tiếng Anh giao tiếp cơ bản",
    teacherName: "Phạm Thị Dung",
    totalRevenue: 136800000,
    totalStudents: 1520,
    price: 90000,
    category: "Ngoại ngữ",
  },
  {
    id: "C004",
    name: "Data Science & Machine Learning",
    teacherName: "Lê Hoàng Cường",
    totalRevenue: 128400000,
    totalStudents: 856,
    price: 150000,
    category: "Công nghệ thông tin",
  },
  {
    id: "C005",
    name: "Quản trị doanh nghiệp hiện đại",
    teacherName: "Hoàng Văn Em",
    totalRevenue: 111750000,
    totalStudents: 745,
    price: 150000,
    category: "Kinh doanh",
  },
  {
    id: "C006",
    name: "Thiết kế UI/UX chuyên nghiệp",
    teacherName: "Vũ Thị Phương",
    totalRevenue: 98000000,
    totalStudents: 560,
    price: 175000,
    category: "Thiết kế",
  },
  {
    id: "C007",
    name: "Excel nâng cao cho kế toán",
    teacherName: "Đỗ Văn Giang",
    totalRevenue: 85500000,
    totalStudents: 950,
    price: 90000,
    category: "Kỹ năng văn phòng",
  },
  {
    id: "C008",
    name: "Photoshop từ A-Z",
    teacherName: "Bùi Thị Hương",
    totalRevenue: 76500000,
    totalStudents: 680,
    price: 112500,
    category: "Thiết kế",
  },
  {
    id: "C009",
    name: "Python cho người mới bắt đầu",
    teacherName: "Nguyễn Văn An",
    totalRevenue: 72000000,
    totalStudents: 800,
    price: 90000,
    category: "Công nghệ thông tin",
  },
  {
    id: "C010",
    name: "Content Marketing thực chiến",
    teacherName: "Trần Thị Bình",
    totalRevenue: 68250000,
    totalStudents: 455,
    price: 150000,
    category: "Marketing",
  },
];

export const mockCourseRevenueData: CourseRevenueData = {
  courses: mockCourses,
  chartData: mockCourses.slice(0, 10).map((c) => ({
    name: c.name.length > 30 ? c.name.substring(0, 30) + "..." : c.name,
    revenue: c.totalRevenue,
  })),
  topCourses: mockCourses.slice(0, 5),
};
