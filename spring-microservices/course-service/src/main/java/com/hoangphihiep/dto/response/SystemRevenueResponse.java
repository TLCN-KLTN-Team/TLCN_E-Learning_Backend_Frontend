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
public class SystemRevenueResponse {
    
    private BigDecimal totalRevenue; // Tổng platform fee
    private BigDecimal totalAccrued; // Số tiền đã accrued
    private BigDecimal totalSettled; // Số tiền đã settled
    
    private BigDecimal totalGrossRevenue; // Tổng doanh thu toàn hệ thống (trước khi chia)
    private BigDecimal totalTeacherRevenue; // Tổng doanh thu của teachers
    private BigDecimal totalAdminRevenue; // Tổng doanh thu của admins
    
    private Integer totalOrders; // Tổng số đơn hàng có doanh thu (có ≥1 item hợp lệ)
    private Integer totalRefundedOrders; // Tổng số đơn hàng có chứa ít nhất 1 item bị refund
    private Integer totalPartiallyRefundedOrders; // Số đơn hàng refund 1 phần (còn items hợp lệ)
    private Integer totalFullyRefundedOrders; // Số đơn hàng refund toàn bộ (tất cả items đều refund)
    private Integer totalOrderItems; // Tổng số order items đã thanh toán
    private Integer totalRefundedItems; // Tổng số order items bị refund
    private Integer totalCourses; // Tổng số khóa học
    private Integer totalStudents; // Tổng số học viên
    private Integer totalTeachers; // Tổng số giảng viên
    private Integer totalEducationalUnits; // Tổng số đơn vị đào tạo
    
    private Double sharePercentage; // Tỉ lệ platform fee (%)
    
    private List<MonthlyRevenueDetail> monthlyRevenueDetails; // Chi tiết doanh thu theo tháng
    private List<EducationalUnitRevenueDetail> educationalUnitRevenueDetails; // Chi tiết theo đơn vị
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDetail {
        private String month; // Format: "2024-01"
        private BigDecimal grossRevenue; // Tổng doanh thu
        private BigDecimal systemRevenue; // Platform fee
        private BigDecimal teacherRevenue; // Teacher share
        private BigDecimal adminRevenue; // Admin share
        private Integer orders;
        private Integer refunds; // Số đơn hàng đã hoàn tiền trong tháng
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationalUnitRevenueDetail {
        private String unitId;
        private String unitName;
        private BigDecimal totalRevenue; // Revenue của unit
        private BigDecimal totalSystemFee; // Platform fee từ unit này
        private Integer totalCourses;
        private Integer totalTeachers;
        private Integer totalOrders;
    }
}
