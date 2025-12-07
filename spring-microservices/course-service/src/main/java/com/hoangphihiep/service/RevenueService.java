package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.AdminRevenueResponse;
import com.hoangphihiep.dto.response.SystemRevenueResponse;
import com.hoangphihiep.dto.response.TeacherRevenueResponse;
import com.hoangphihiep.entity.PayoutOrderItem;
import com.hoangphihiep.repository.PayoutOrderItemRepository;
import com.hoangphihiep.repository.RevenueShareConfigRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import com.hoangphihiep.utils.RecipientType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RevenueService {
    
    private final PayoutOrderItemRepository payoutOrderItemRepository;
    private final RevenueShareConfigRepository revenueShareConfigRepository;
    private final TeacherRepository teacherRepository;
    private final com.hoangphihiep.repository.ReviewRepository reviewRepository;

    public TeacherRevenueResponse getTeacherRevenue() {
        String teacherId = JwtUtils.getCurrentUserId();
        return getTeacherRevenueByTeacherId(teacherId);
    }

    public TeacherRevenueResponse getTeacherRevenueByTeacherId(String teacherId) {
        log.info("Getting revenue for teacher ID: {}", teacherId);
        
        // Get all payout items for this teacher
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
        
        // Calculate totals
        BigDecimal totalAccrued = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders and courses
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            // Get student from order
            uniqueStudents.add(item.getOrderItem().getOrder().getId()); // Simplified: using order ID as student count
        }
        
        // Get share percentage from config
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrderItem().getCourse().getId()));
        
        List<TeacherRevenueResponse.CourseRevenueDetail> courseDetails = new ArrayList<>();
        for (Map.Entry<Integer, List<PayoutOrderItem>> entry : itemsByCourse.entrySet()) {
            var course = entry.getValue().get(0).getOrderItem().getCourse();
            BigDecimal courseRevenue = entry.getValue().stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get average rating from Review table
            Double averageRating = reviewRepository.getAverageRatingByCourseId(course.getId());
            
            courseDetails.add(TeacherRevenueResponse.CourseRevenueDetail.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName()) // Changed from courseTitle
                    .courseThumbnail(course.getCourseImage())
                    .revenue(courseRevenue) // Changed from totalRevenue
                    .totalSales(entry.getValue().size())
                    .totalStudents(entry.getValue().size()) // Simplified
                    .averageRating(averageRating != null ? averageRating : 0.0)
                    .build());
        }
        
        // Group by month for monthly revenue details
        List<TeacherRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonth(payoutItems);
        
        // Get teacher name from identity service
        String teacherName = "Teacher " + teacherId; // Default fallback
        try {
            var teacherResponse = teacherRepository.getTeacherByUserId(teacherId);
            if (teacherResponse != null && teacherResponse.getResult() != null) {
                var teacher = teacherResponse.getResult();
                if (teacher.getFirstName() != null && teacher.getLastName() != null) {
                    teacherName = teacher.getFirstName() + " " + teacher.getLastName();
                } else if (teacher.getUsername() != null) {
                    teacherName = teacher.getUsername();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get teacher name for ID {}: {}", teacherId, e.getMessage());
        }
        
        return TeacherRevenueResponse.builder()
                .teacherId(teacherId)
                .teacherName(teacherName)
                .totalRevenue(totalRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalPending(BigDecimal.ZERO) // TODO: Get from pending orders
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .sharePercentage(sharePercentage)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .build();
    }

    public TeacherRevenueResponse getTeacherRevenueByRange(String startDate, String endDate) {
        String teacherId = JwtUtils.getCurrentUserId();
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
        
        log.info("Getting revenue for teacher ID: {} from {} to {}", teacherId, startDate, endDate);
        
        // Get all payout items for this teacher
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
        
        // Filter by date range
        List<PayoutOrderItem> payoutItems = allPayoutItems.stream()
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .collect(Collectors.toList());
        
        log.info("Found {} payout items for teacher {} in date range", payoutItems.size(), teacherId);
        
        // Calculate totals
        BigDecimal totalAccrued = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders and courses
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getId()); // Using order ID as proxy for student
        }
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrderItem().getCourse().getId()));
        
        List<TeacherRevenueResponse.CourseRevenueDetail> courseDetails = new ArrayList<>();
        for (Map.Entry<Integer, List<PayoutOrderItem>> entry : itemsByCourse.entrySet()) {
            var course = entry.getValue().get(0).getOrderItem().getCourse();
            BigDecimal courseRevenue = entry.getValue().stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get average rating from Review table
            Double averageRating = reviewRepository.getAverageRatingByCourseId(course.getId());
            
            courseDetails.add(TeacherRevenueResponse.CourseRevenueDetail.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName())
                    .courseThumbnail(course.getCourseImage())
                    .revenue(courseRevenue)
                    .totalSales(entry.getValue().size())
                    .totalStudents(entry.getValue().size())
                    .averageRating(averageRating != null ? averageRating : 0.0)
                    .build());
        }
        
        // Group by month for monthly revenue details
        List<TeacherRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonth(payoutItems);
        
        // Get teacher name from identity service
        String teacherName = "Teacher " + teacherId;
        try {
            var teacherResponse = teacherRepository.getTeacherByUserId(teacherId);
            if (teacherResponse != null && teacherResponse.getResult() != null) {
                var teacher = teacherResponse.getResult();
                if (teacher.getFirstName() != null && teacher.getLastName() != null) {
                    teacherName = teacher.getFirstName() + " " + teacher.getLastName();
                } else if (teacher.getUsername() != null) {
                    teacherName = teacher.getUsername();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get teacher name for ID {}: {}", teacherId, e.getMessage());
        }
        
        log.info("Teacher {} revenue stats - Total: {}, Courses: {}, Students: {}, Orders: {}",
                teacherId, totalRevenue, uniqueCourses.size(), uniqueStudents.size(), uniqueOrders.size());
        
        return TeacherRevenueResponse.builder()
                .totalRevenue(totalRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalPending(BigDecimal.ZERO)
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .sharePercentage(sharePercentage)
                .teacherName(teacherName)
                .teacherId(teacherId)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .build();
    }


    public AdminRevenueResponse getAdminRevenue() {
        String adminId = JwtUtils.getCurrentUserId();
        log.info("Getting revenue for admin ID: {}", adminId);
        
        // Get all payout items for this admin
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(adminId, RecipientType.ADMIN);
        
        log.info("Found {} payout items for admin {}", payoutItems.size(), adminId);
        
        // Calculate totals (similar to teacher)
        BigDecimal totalAccrued = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(20.0);
        
        // Get unique counts
        Set<String> uniqueTeachers = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            var course = item.getOrderItem().getCourse();
            uniqueCourses.add(course.getId());

            String teacherId1 = teacherRepository.getTeacherByTeacherId(course.getCourse().getIdTeacher()).getResult().getId();
            // Get teacher ID from course
            if (teacherId1 != null) {
                uniqueTeachers.add(teacherId1);
            }
            
            // Get student from order (using order ID as proxy)
            uniqueStudents.add(item.getOrderItem().getOrder().getId());
        }
        
        // Group by teacher for teacher revenue details
        // NOTE: Get TEACHER PayoutOrderItems (70% share), not admin items (20%)
        List<AdminRevenueResponse.TeacherRevenueDetail> teacherDetails = new ArrayList<>();
        
        for (String teacherId : uniqueTeachers) {
            // Get payout items for this TEACHER (not admin)
            List<PayoutOrderItem> teacherPayoutItems = payoutOrderItemRepository
                    .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
            
            if (teacherPayoutItems.isEmpty()) {
                continue;
            }
            
            // Calculate teacher's actual revenue (70% share)
            BigDecimal teacherRevenue = teacherPayoutItems.stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get unique courses and students for this teacher
            Set<Integer> teacherCourses = teacherPayoutItems.stream()
                    .map(item -> item.getOrderItem().getCourse().getId())
                    .collect(Collectors.toSet());
            
            Set<Integer> teacherStudents = teacherPayoutItems.stream()
                    .map(item -> item.getOrderItem().getOrder().getId())
                    .collect(Collectors.toSet());
            
            // Calculate average rating across all teacher's courses
            double averageRating = 0.0;
            if (!teacherCourses.isEmpty()) {
                double totalRating = 0.0;
                int ratedCoursesCount = 0;
                
                for (Integer courseId : teacherCourses) {
                    Double courseRating = reviewRepository.getAverageRatingByCourseId(courseId);
                    if (courseRating != null && courseRating > 0) {
                        totalRating += courseRating;
                        ratedCoursesCount++;
                    }
                }
                
                if (ratedCoursesCount > 0) {
                    averageRating = totalRating / ratedCoursesCount;
                }
            }
            
            // Get teacher name from teacher service
            String teacherName = "Teacher "; // Default
            try {
                System.out.println ("id của giảng viên: " + teacherId);
                var teacherResponse = teacherRepository.getTeacherByUserId(teacherId);
                System.out.println ("giảng viên: "+ teacherResponse );
                if (teacherResponse != null && teacherResponse.getResult() != null) {
                    var teacher = teacherResponse.getResult();
                    // Build full name or use username
                    if (teacher.getFirstName() != null && teacher.getLastName() != null) {
                        teacherName = teacher.getFirstName() + " " + teacher.getLastName();
                    } else if (teacher.getUsername() != null) {
                        teacherName = teacher.getUsername();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get teacher name for ID {}: {}", teacherId, e.getMessage());
            }
            
            teacherDetails.add(AdminRevenueResponse.TeacherRevenueDetail.builder()
                    .teacherId(teacherId)
                    .teacherName(teacherName)
                    .revenue(teacherRevenue) // Teacher's 70% revenue, not admin's 20%
                    .courseCount(teacherCourses.size())
                    .studentCount(teacherStudents.size())
                    .averageRating(averageRating)
                    .build());
        }
        
        // Sort by revenue descending
        teacherDetails.sort((a, b) -> b.getRevenue().compareTo(a.getRevenue()));
        
        // Group by month
        List<AdminRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForAdmin(payoutItems);
        
        log.info("Admin revenue - Total: {}, Teachers: {}, Courses: {}, Students: {}", 
                totalRevenue, uniqueTeachers.size(), uniqueCourses.size(), uniqueStudents.size());
        
        return AdminRevenueResponse.builder()
                .totalRevenue(totalRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalPending(BigDecimal.ZERO)
                .totalCourses(uniqueCourses.size())
                .totalTeachers(uniqueTeachers.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(payoutItems.size())
                .sharePercentage(sharePercentage)
                .educationalUnitName("Educational Unit") // TODO: Get from actual data
                .educationalUnitId(adminId)
                .teacherRevenueDetails(teacherDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .build();
    }

    public AdminRevenueResponse getAdminRevenueByRange(String startDate, String endDate) {
        String adminId = JwtUtils.getCurrentUserId();
        log.info("Getting revenue for admin ID: {} from {} to {}", adminId, startDate, endDate);
        
        // Parse date strings to LocalDateTime
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
        
        // Get all payout items for this admin
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(adminId, RecipientType.ADMIN);
        
        // Filter by date range
        List<PayoutOrderItem> payoutItems = allPayoutItems.stream()
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .collect(Collectors.toList());
        
        log.info("Found {} payout items for admin {} in date range", payoutItems.size(), adminId);
        
        // Calculate totals (similar to teacher)
        BigDecimal totalAccrued = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(20.0);
        
        // Get unique counts from filtered items
        Set<String> uniqueTeachers = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            var course = item.getOrderItem().getCourse();
            uniqueCourses.add(course.getId());

            String teacherId1 = teacherRepository.getTeacherByTeacherId(course.getCourse().getIdTeacher()).getResult().getId();
            if (teacherId1 != null) {
                uniqueTeachers.add(teacherId1);
            }
            
            uniqueStudents.add(item.getOrderItem().getOrder().getId());
        }
        
        // Group by teacher for teacher revenue details (filtered by date)
        List<AdminRevenueResponse.TeacherRevenueDetail> teacherDetails = new ArrayList<>();
        
        for (String teacherId : uniqueTeachers) {
            // Get payout items for this TEACHER filtered by date range
            List<PayoutOrderItem> allTeacherPayoutItems = payoutOrderItemRepository
                    .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
            
            List<PayoutOrderItem> teacherPayoutItems = allTeacherPayoutItems.stream()
                    .filter(item -> {
                        LocalDateTime accruedAt = item.getAccruedAt();
                        return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                    })
                    .collect(Collectors.toList());
            
            if (teacherPayoutItems.isEmpty()) {
                continue;
            }
            
            // Calculate teacher's actual revenue (70% share)
            BigDecimal teacherRevenue = teacherPayoutItems.stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get unique courses and students for this teacher (filtered)
            Set<Integer> teacherCourses = teacherPayoutItems.stream()
                    .map(item -> item.getOrderItem().getCourse().getId())
                    .collect(Collectors.toSet());
            
            Set<Integer> teacherStudents = teacherPayoutItems.stream()
                    .map(item -> item.getOrderItem().getOrder().getId())
                    .collect(Collectors.toSet());
            
            // Calculate average rating across all teacher's courses
            double averageRating = 0.0;
            if (!teacherCourses.isEmpty()) {
                double totalRating = 0.0;
                int ratedCoursesCount = 0;
                
                for (Integer courseId : teacherCourses) {
                    Double courseRating = reviewRepository.getAverageRatingByCourseId(courseId);
                    if (courseRating != null && courseRating > 0) {
                        totalRating += courseRating;
                        ratedCoursesCount++;
                    }
                }
                
                if (ratedCoursesCount > 0) {
                    averageRating = totalRating / ratedCoursesCount;
                }
            }
            
            // Get teacher name from teacher service
            String teacherName = "Teacher ";
            try {
                var teacherResponse = teacherRepository.getTeacherByUserId(teacherId);
                if (teacherResponse != null && teacherResponse.getResult() != null) {
                    var teacher = teacherResponse.getResult();
                    if (teacher.getFirstName() != null && teacher.getLastName() != null) {
                        teacherName = teacher.getFirstName() + " " + teacher.getLastName();
                    } else if (teacher.getUsername() != null) {
                        teacherName = teacher.getUsername();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get teacher name for ID {}: {}", teacherId, e.getMessage());
            }
            
            teacherDetails.add(AdminRevenueResponse.TeacherRevenueDetail.builder()
                    .teacherId(teacherId)
                    .teacherName(teacherName)
                    .revenue(teacherRevenue)
                    .courseCount(teacherCourses.size())
                    .studentCount(teacherStudents.size())
                    .averageRating(averageRating)
                    .build());
        }
        
        // Group by month for monthly revenue details (filtered)
        List<AdminRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForAdmin(payoutItems);
        
        log.info("Admin revenue stats - Total: {}, Teachers: {}, Courses: {}, Students: {}",
                totalRevenue, uniqueTeachers.size(), uniqueCourses.size(), uniqueStudents.size());
        
        return AdminRevenueResponse.builder()
                .totalRevenue(totalRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalPending(BigDecimal.ZERO)
                .totalCourses(uniqueCourses.size())
                .totalTeachers(uniqueTeachers.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(payoutItems.size())
                .sharePercentage(sharePercentage)
                .educationalUnitName("Educational Unit") // TODO: Get from admin profile
                .educationalUnitId(adminId)
                .teacherRevenueDetails(teacherDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .build();
    }

    public SystemRevenueResponse getSystemRevenue() {
        log.info("Getting system revenue");
        
        // Get all payout items for SUPER_ADMIN (system)
        List<PayoutOrderItem> systemPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType("SYSTEM", RecipientType.SUPER_ADMIN);
        
        // Calculate system revenue
        BigDecimal totalAccrued = systemPayoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = systemPayoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSystemRevenue = totalAccrued.add(totalSettled);
        
        // Get all payout items to calculate gross revenue
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository.findAll();
        
        BigDecimal totalGrossRevenue = allPayoutItems.stream()
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTeacherRevenue = allPayoutItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAdminRevenue = allPayoutItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.SUPER_ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(10.0);
        
        // Group by month
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(allPayoutItems);
        
        // Count unique courses and students
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : allPayoutItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getCourse() != null) {
                uniqueCourses.add(item.getOrderItem().getCourse().getId());
            }
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                uniqueStudents.add(item.getOrderItem().getOrder().getId());
            }
        }
        
        return SystemRevenueResponse.builder()
                .totalRevenue(totalSystemRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalGrossRevenue(totalGrossRevenue)
                .totalTeacherRevenue(totalTeacherRevenue)
                .totalAdminRevenue(totalAdminRevenue)
                .totalOrders(systemPayoutItems.size())
                .totalCourses(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalTeachers(0) // TODO: Get from actual data
                .totalEducationalUnits(0) // TODO: Get from actual data
                .sharePercentage(sharePercentage)
                .monthlyRevenueDetails(monthlyDetails)
                .educationalUnitRevenueDetails(new ArrayList<>()) // TODO: Implement
                .build();
    }

    public SystemRevenueResponse getSystemRevenueByRange(String startDate, String endDate) {
        log.info("Getting system revenue from {} to {}", startDate, endDate);
        
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
        
        // Get all payout items for SUPER_ADMIN (system) within date range
        List<PayoutOrderItem> systemPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType("SYSTEM", RecipientType.SUPER_ADMIN)
                .stream()
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .collect(Collectors.toList());
        
        // Calculate system revenue
        BigDecimal totalAccrued = systemPayoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = systemPayoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSystemRevenue = totalAccrued.add(totalSettled);
        
        // Get all payout items within date range to calculate gross revenue
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository.findAll().stream()
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .collect(Collectors.toList());
        
        BigDecimal totalGrossRevenue = allPayoutItems.stream()
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTeacherRevenue = allPayoutItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAdminRevenue = allPayoutItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.SUPER_ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(10.0);
        
        // Group by month
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(allPayoutItems);
        
        // Count unique courses, teachers, students from filtered items
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : allPayoutItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getCourse() != null) {
                uniqueCourses.add(item.getOrderItem().getCourse().getId());
            }
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                uniqueStudents.add(item.getOrderItem().getOrder().getId());
            }
        }
        
        return SystemRevenueResponse.builder()
                .totalRevenue(totalSystemRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalGrossRevenue(totalGrossRevenue)
                .totalTeacherRevenue(totalTeacherRevenue)
                .totalAdminRevenue(totalAdminRevenue)
                .totalOrders(systemPayoutItems.size())
                .totalCourses(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalTeachers(0) // TODO: Get from actual data
                .totalEducationalUnits(0) // TODO: Get from actual data
                .sharePercentage(sharePercentage)
                .monthlyRevenueDetails(monthlyDetails)
                .educationalUnitRevenueDetails(new ArrayList<>()) // TODO: Implement
                .build();
    }

    public List<TeacherRevenueResponse> getAllTeachersRevenue() {
        // Get all unique teacher IDs
        List<String> teacherIds = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getRecipientId)
                .distinct()
                .collect(Collectors.toList());
        
        return teacherIds.stream()
                .map(this::getTeacherRevenueByTeacherId)
                .collect(Collectors.toList());
    }
    
    public List<TeacherRevenueResponse> getAllTeachersRevenueByRange(String startDate, String endDate) {
        log.info("Getting all teachers revenue from {} to {}", startDate, endDate);
        
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
        
        // Get all unique teacher IDs from items within date range
        List<String> teacherIds = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .map(PayoutOrderItem::getRecipientId)
                .distinct()
                .collect(Collectors.toList());
        
        return teacherIds.stream()
                .map(teacherId -> getTeacherRevenueByTeacherIdAndRange(teacherId, start, end))
                .filter(response -> response.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0) // Only include teachers with revenue
                .collect(Collectors.toList());
    }
    
    private TeacherRevenueResponse getTeacherRevenueByTeacherIdAndRange(String teacherId, LocalDateTime start, LocalDateTime end) {
        log.info("Getting revenue for teacher ID: {} from {} to {}", teacherId, start, end);
        
        // Get all payout items for this teacher within date range
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER)
                .stream()
                .filter(item -> {
                    LocalDateTime accruedAt = item.getAccruedAt();
                    return accruedAt != null && !accruedAt.isBefore(start) && !accruedAt.isAfter(end);
                })
                .collect(Collectors.toList());
        
        // Calculate totals
        BigDecimal totalAccrued = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED || 
                              item.getStatus() == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSettled = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.SETTLED)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders and courses
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getId());
        }
        
        // Get share percentage from config
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrderItem().getCourse().getId()));
        
        List<TeacherRevenueResponse.CourseRevenueDetail> courseDetails = new ArrayList<>();
        for (Map.Entry<Integer, List<PayoutOrderItem>> entry : itemsByCourse.entrySet()) {
            var course = entry.getValue().get(0).getOrderItem().getCourse();
            BigDecimal courseRevenue = entry.getValue().stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get average rating from Review table
            Double averageRating = reviewRepository.getAverageRatingByCourseId(course.getId());
            
            courseDetails.add(TeacherRevenueResponse.CourseRevenueDetail.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName())
                    .courseThumbnail(course.getCourseImage())
                    .revenue(courseRevenue)
                    .totalSales(entry.getValue().size())
                    .totalStudents(entry.getValue().size())
                    .averageRating(averageRating != null ? averageRating : 0.0)
                    .build());
        }
        
        // Group by month for monthly revenue details
        List<TeacherRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonth(payoutItems);
        
        // Get teacher name from identity service
        String teacherName = "Teacher " + teacherId;
        try {
            var teacherResponse = teacherRepository.getTeacherByUserId(teacherId);
            if (teacherResponse != null && teacherResponse.getResult() != null) {
                var teacher = teacherResponse.getResult();
                if (teacher.getFirstName() != null && teacher.getLastName() != null) {
                    teacherName = teacher.getFirstName() + " " + teacher.getLastName();
                } else if (teacher.getUsername() != null) {
                    teacherName = teacher.getUsername();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get teacher name for ID {}: {}", teacherId, e.getMessage());
        }
        
        return TeacherRevenueResponse.builder()
                .teacherId(teacherId)
                .teacherName(teacherName)
                .totalRevenue(totalRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalPending(BigDecimal.ZERO)
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .sharePercentage(sharePercentage)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .build();
    }

    public List<AdminRevenueResponse> getAllAdminsRevenue() {
        // Similar to getAllTeachersRevenue but for admins
        return new ArrayList<>(); // TODO: Implement
    }
    
    
    private List<TeacherRevenueResponse.MonthlyRevenueDetail> groupByMonth(List<PayoutOrderItem> items) {
        Map<String, List<PayoutOrderItem>> itemsByMonth = items.stream()
                .collect(Collectors.groupingBy(item -> 
                    item.getAccruedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))));
        
        return itemsByMonth.entrySet().stream()
                .map(entry -> TeacherRevenueResponse.MonthlyRevenueDetail.builder()
                        .month(entry.getKey())
                        .revenue(entry.getValue().stream()
                                .map(PayoutOrderItem::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .orderCount(entry.getValue().size()) // Changed from orders
                        .build())
                .sorted(Comparator.comparing(TeacherRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
    
    private List<AdminRevenueResponse.MonthlyRevenueDetail> groupByMonthForAdmin(List<PayoutOrderItem> items) {
        Map<String, List<PayoutOrderItem>> itemsByMonth = items.stream()
                .collect(Collectors.groupingBy(item -> 
                    item.getAccruedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))));
        
        return itemsByMonth.entrySet().stream()
                .map(entry -> AdminRevenueResponse.MonthlyRevenueDetail.builder()
                        .month(entry.getKey())
                        .revenue(entry.getValue().stream()
                                .map(PayoutOrderItem::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .orderCount(entry.getValue().size()) // Changed from orders
                        .build())
                .sorted(Comparator.comparing(AdminRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
    
    private List<SystemRevenueResponse.MonthlyRevenueDetail> groupByMonthForSystem(List<PayoutOrderItem> items) {
        Map<String, List<PayoutOrderItem>> itemsByMonth = items.stream()
                .collect(Collectors.groupingBy(item -> 
                    item.getAccruedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))));
        
        return itemsByMonth.entrySet().stream()
                .map(entry -> {
                    BigDecimal grossRevenue = entry.getValue().stream()
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal teacherRevenue = entry.getValue().stream()
                            .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal adminRevenue = entry.getValue().stream()
                            .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal systemRevenue = entry.getValue().stream()
                            .filter(item -> item.getRecipientType() == RecipientType.SUPER_ADMIN)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    return SystemRevenueResponse.MonthlyRevenueDetail.builder()
                            .month(entry.getKey())
                            .grossRevenue(grossRevenue)
                            .systemRevenue(systemRevenue)
                            .teacherRevenue(teacherRevenue)
                            .adminRevenue(adminRevenue)
                            .orders(entry.getValue().size())
                            .build();
                })
                .sorted(Comparator.comparing(SystemRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
}
