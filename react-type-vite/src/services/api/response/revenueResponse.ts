export interface MonthlyRevenueDetail {
    month: string; // Format: "yyyy-MM"
    revenue: number;
    orderCount: number;
    refundedOrders?: number;
}

export interface CourseRevenueDetail {
    courseId: string;
    courseName: string;
    courseThumbnail: string;
    totalSales: number;
    totalStudents: number;
    averageRating: number;
    revenue: number;
}

export interface RefundDetail {
    orderItemId: number;
    orderId: number;
    courseId: number;
    courseName: string;
    courseThumbnail: string;
    buyerId: string;
    buyerName: string;
    refundedAmount: number;
    refundedAt: string;
    refundStatus: string;
}

// Specific for Admin view of teachers
export interface AdminTeacherRevenueDetail {
    teacherId: string;
    teacherName: string;
    courseCount: number;
    studentCount: number;
    averageRating: number;
    revenue: number;
}

// Specific for SuperAdmin view of teachers
export interface SystemTeacherRevenueDetail {
    teacherId: string;
    teacherName: string;
    revenue: number;
    courseCount: number;
    orderCount: number;
}

export interface TeacherRevenueResponse {
    teacherId?: string;
    teacherName?: string;
    totalRevenue: number;
    totalAccrued: number;
    totalSettled: number;
    totalPending: number;
    totalReversed: number;
    totalCoursesSold: number;
    totalStudents: number;
    totalOrders: number;
    totalRefundedOrders: number;
    totalPartiallyRefundedOrders: number; // Đơn hàng refund 1 phần
    totalFullyRefundedOrders: number; // Đơn hàng refund toàn bộ
    totalOrderItems: number; // Tổng số items đã bán
    totalRefundedItems: number; // Tổng số items bị refund
    sharePercentage: number;
    courseRevenueDetails: CourseRevenueDetail[];
    monthlyRevenueDetails: MonthlyRevenueDetail[];
    refundDetails: RefundDetail[];
}

export interface AdminRevenueResponse {
    educationalUnitId: string;
    educationalUnitName: string;
    totalRevenue: number;
    totalAccrued: number;
    totalSettled: number;
    totalPending: number;
    totalTeachers: number;
    totalCourses: number;
    totalStudents: number;
    totalOrders: number;
    totalRefundedOrders: number;
    totalPartiallyRefundedOrders: number;
    totalFullyRefundedOrders: number;
    totalOrderItems: number;
    totalRefundedItems: number;
    sharePercentage: number;
    teacherRevenueDetails: AdminTeacherRevenueDetail[];
    monthlyRevenueDetails: MonthlyRevenueDetail[];
}

export interface SystemMonthlyRevenueDetail {
    month: string; // Format: "yyyy-MM"
    grossRevenue: number;
    systemRevenue: number;
    teacherRevenue: number;
    adminRevenue: number;
    orders: number;
    refunds: number; // Số đơn hàng đã hoàn tiền trong tháng
}

export interface SystemRevenueResponse {
    totalRevenue: number;
    totalAccrued: number;
    totalSettled: number;
    totalGrossRevenue: number;
    totalTeacherRevenue: number;
    totalAdminRevenue: number;
    totalOrders: number; // Đơn hàng có doanh thu (có ≥1 item hợp lệ)
    totalRefundedOrders: number; // Đơn hàng có chứa refund
    totalPartiallyRefundedOrders: number; // Đơn hàng refund 1 phần
    totalFullyRefundedOrders: number; // Đơn hàng refund toàn bộ
    totalOrderItems: number; // Tổng số items đã thanh toán
    totalRefundedItems: number; // Tổng số items bị refund
    totalCourses: number;
    totalStudents: number;
    totalTeachers: number;
    totalEducationalUnits: number;
    sharePercentage: number;
    monthlyRevenueDetails: SystemMonthlyRevenueDetail[];
}
