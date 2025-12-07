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
public class AdminRevenueResponse {
    
    private BigDecimal totalRevenue; // Tổng doanh thu của educational unit
    private BigDecimal totalAccrued; // Số tiền đã accrued
    private BigDecimal totalSettled; // Số tiền đã settled
    private BigDecimal totalPending; // Số tiền pending
    
    private Integer totalCourses; // Tổng số khóa học của unit
    private Integer totalTeachers; // Tổng số giảng viên
    private Integer totalStudents; // Tổng số học viên
    private Integer totalOrders; // Tổng số đơn hàng
    
    private Double sharePercentage; // Tỉ lệ chiết khấu (%)
    
    private String educationalUnitName; // Tên đơn vị đào tạo
    private String educationalUnitId; // ID đơn vị đào tạo
    
    private List<TeacherRevenueDetail> teacherRevenueDetails; // Chi tiết doanh thu theo giảng viên
    private List<MonthlyRevenueDetail> monthlyRevenueDetails; // Chi tiết doanh thu theo tháng
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherRevenueDetail {
        private String teacherId;
        private String teacherName;
        private BigDecimal revenue; // Changed from totalRevenue
        private Integer courseCount; // Changed from totalCourses
        private Integer studentCount; // Changed from totalStudents
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
    }
}
