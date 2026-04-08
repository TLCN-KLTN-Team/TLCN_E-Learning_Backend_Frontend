package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherRevenueResponse {
    
    private String teacherId; // Teacher's user ID
    private String teacherName; // Teacher's display name
    
    private BigDecimal totalRevenue; // Tổng doanh thu
    private BigDecimal totalAccrued; // Số tiền đã accrued (chưa settled)
    private BigDecimal totalSettled; // Số tiền đã settled (đã thanh toán)
    private BigDecimal totalPending; // Số tiền pending (từ order items chưa paid)
    private BigDecimal totalReversed; // Số tiền đã bị hoàn trả
    
    private Integer totalCoursesSold; // Tổng số khóa học đã bán
    private Integer totalStudents; // Tổng số học viên
    private Integer totalOrders; // Tổng số đơn hàng có doanh thu
    private Integer totalRefundedOrders; // Tổng số đơn hàng có chứa refund
    private Integer totalPartiallyRefundedOrders; // Số đơn hàng refund 1 phần
    private Integer totalFullyRefundedOrders; // Số đơn hàng refund toàn bộ
    private Integer totalOrderItems; // Tổng số order items đã bán
    private Integer totalRefundedItems; // Tổng số order items bị refund
    
    private Double sharePercentage; // Tỉ lệ chiết khấu (%)
    
    private List<CourseRevenueDetail> courseRevenueDetails; // Chi tiết doanh thu theo khóa học
    private List<MonthlyRevenueDetail> monthlyRevenueDetails; // Chi tiết doanh thu theo tháng
    private List<RefundDetail> refundDetails; // Chi tiết các đơn hàng hoàn tiền
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseRevenueDetail {
        private Integer courseId;
        private String courseName; // Changed from courseTitle
        private String courseThumbnail;
        private BigDecimal revenue; // Changed from totalRevenue
        private Integer totalSales;
        private Integer totalStudents;
        private Double averageRating;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDetail {
        private String month; // Format: "2024-01"
        private BigDecimal revenue;
        private Integer orderCount; // Changed from orders
        private Integer refundedOrders;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundDetail {
        private Integer orderItemId;
        private Integer orderId;
        private Integer courseId;
        private String courseName;
        private String courseThumbnail;
        private String buyerId; // User ID của người mua
        private String buyerName; // Tên người mua khóa học
        private BigDecimal refundedAmount; // Teacher's share of refund
        private String refundedAt; // ISO date-time string
        private String refundStatus; // REVERSED or REVERSED_AFTER_SETTLEMENT
    }
}
