package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.AdminRevenueResponse;
import com.hoangphihiep.dto.response.SystemRevenueResponse;
import com.hoangphihiep.dto.response.TeacherRevenueResponse;
import com.hoangphihiep.entity.PayoutOrderItem;
import com.hoangphihiep.repository.PayoutOrderItemRepository;
import com.hoangphihiep.repository.RevenueShareConfigRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.repository.httpclient.UserRepository;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import com.hoangphihiep.utils.RecipientType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final UserRepository userRepository;
    private final com.hoangphihiep.repository.ReviewRepository reviewRepository;

    private boolean isCountableRevenue(PayoutOrderItemStatus status) {
        return status == PayoutOrderItemStatus.ACCRUED ||
               status == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT ||
               status == PayoutOrderItemStatus.SETTLED;
    }
    
    /**
     * Deduplicate PayoutOrderItems to handle cases where duplicate records exist in database
     * (e.g., when releaseEscrowAndSplit runs multiple times for the same order_item)
     * Keep only one PayoutOrderItem per order_item_id + recipient_type combination
     */
    private List<PayoutOrderItem> deduplicatePayoutItems(List<PayoutOrderItem> items) {
        Map<String, PayoutOrderItem> deduplicatedMap = new HashMap<>();
        for (PayoutOrderItem item : items) {
            if (item.getOrderItem() != null) {
                String key = item.getOrderItem().getId() + "_" + item.getRecipientType();
                // Keep the one with higher ID (most recent) if duplicates exist
                if (!deduplicatedMap.containsKey(key) || 
                    deduplicatedMap.get(key).getId() < item.getId()) {
                    deduplicatedMap.put(key, item);
                }
            }
        }
        return new ArrayList<>(deduplicatedMap.values());
    }

    public TeacherRevenueResponse getTeacherRevenue() {
        String teacherId = JwtUtils.getCurrentUserId();
        return getTeacherRevenueByTeacherId(teacherId);
    }

    public TeacherRevenueResponse getTeacherRevenueByTeacherId(String teacherId) {
        log.info("Getting revenue for teacher ID: {}", teacherId);
        
        // Get all payout items for this teacher
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        payoutItems = deduplicatePayoutItems(payoutItems);
        
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
        
        BigDecimal totalReversed = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                              item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders and courses
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        Set<Integer> refundedOrders = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            // Get student from order
            uniqueStudents.add(item.getOrderItem().getOrder().getId()); // Simplified: using order ID as student count
            
            // Track refunded orders
            if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                refundedOrders.add(item.getOrderItem().getOrder().getId());
            }
        }
        
        // Get share percentage from config
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details (exclude non-countable items for net revenue)
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
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
        
        // Get refund details
        List<TeacherRevenueResponse.RefundDetail> refundDetails = buildRefundDetails(payoutItems);
        
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
                .totalReversed(totalReversed)
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(refundedOrders.size())
                .sharePercentage(sharePercentage)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .refundDetails(refundDetails)
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
        
        BigDecimal totalReversed = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                              item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders and courses
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<Integer> uniqueStudents = new HashSet<>();
        Set<Integer> refundedOrders = new HashSet<>();
        
        for (PayoutOrderItem item : payoutItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getId()); // Using order ID as proxy for student
            
            // Track refunded orders
            if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                refundedOrders.add(item.getOrderItem().getOrder().getId());
            }
        }
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details (exclude non-countable items for net revenue)
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
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
        
        // Get refund details
        List<TeacherRevenueResponse.RefundDetail> refundDetails = buildRefundDetails(payoutItems);
        
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
                .totalReversed(totalReversed)
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(refundedOrders.size())
                .sharePercentage(sharePercentage)
                .teacherName(teacherName)
                .teacherId(teacherId)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .refundDetails(refundDetails)
                .build();
    }


    public AdminRevenueResponse getAdminRevenue() {
        String adminId = JwtUtils.getCurrentUserId();
        log.info("Getting revenue for admin ID: {}", adminId);
        
        // Get all payout items for this admin
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(adminId, RecipientType.ADMIN);
        
        log.info("Found {} payout items for admin {}", payoutItems.size(), adminId);
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        payoutItems = deduplicatePayoutItems(payoutItems);
        
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
        
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = payoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());
        
        // Get unique counts
        Set<String> uniqueTeachers = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        
        for (PayoutOrderItem item : countableItems) {
            var course = item.getOrderItem().getCourse();
            uniqueCourses.add(course.getId());
            uniqueOrderItemIds.add(item.getOrderItem().getId());

            String teacherId1 = teacherRepository.getTeacherByTeacherId(course.getCourse().getIdTeacher()).getResult().getId();
            // Get teacher ID from course
            if (teacherId1 != null) {
                uniqueTeachers.add(teacherId1);
            }
            
            // Get student from order (using user ID)
            uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
        }
        
        // Track refunds
        Set<Integer> refundedOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();
        
        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();
            
            if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                refundedOrderItemIds.add(orderItemId);
                orderToRefundedItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            } else if (isCountableRevenue(item.getStatus())) {
                orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            }
        }
        
        // Classify orders
        Set<Integer> allOrdersWithRefunds = new HashSet<>(orderToRefundedItems.keySet());
        Set<Integer> partiallyRefundedOrders = new HashSet<>();
        Set<Integer> fullyRefundedOrders = new HashSet<>();
        
        for (Integer orderId : allOrdersWithRefunds) {
            boolean hasValidItems = orderToValidItems.containsKey(orderId) && !orderToValidItems.get(orderId).isEmpty();
            if (hasValidItems) {
                partiallyRefundedOrders.add(orderId);
            } else {
                fullyRefundedOrders.add(orderId);
            }
        }
        
        // Get unique orders from valid items
        Set<Integer> uniqueOrders = new HashSet<>();
        for (PayoutOrderItem item : countableItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
        }
        
        // Group by teacher for teacher revenue details
        // NOTE: Get TEACHER PayoutOrderItems (70% share), not admin items (20%)
        List<AdminRevenueResponse.TeacherRevenueDetail> teacherDetails = new ArrayList<>();
        
        for (String teacherId : uniqueTeachers) {
            // Get payout items for this TEACHER (not admin)
            List<PayoutOrderItem> teacherPayoutItems = payoutOrderItemRepository
                    .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
            
            // Filter for countable revenue items
            List<PayoutOrderItem> countableTeacherItems = teacherPayoutItems.stream()
                    .filter(item -> isCountableRevenue(item.getStatus()))
                    .collect(Collectors.toList());
            
            if (countableTeacherItems.isEmpty()) {
                continue;
            }
            
            // Calculate teacher's actual revenue (70% share)
            BigDecimal teacherRevenue = countableTeacherItems.stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get unique courses and students for this teacher
            Set<Integer> teacherCourses = countableTeacherItems.stream()
                    .map(item -> item.getOrderItem().getCourse().getId())
                    .collect(Collectors.toSet());
            
            Set<Integer> teacherStudents = countableTeacherItems.stream()
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
        List<AdminRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForAdmin(countableItems);
        
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
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(allOrdersWithRefunds.size())
                .totalPartiallyRefundedOrders(partiallyRefundedOrders.size())
                .totalFullyRefundedOrders(fullyRefundedOrders.size())
                .totalOrderItems(uniqueOrderItemIds.size())
                .totalRefundedItems(refundedOrderItemIds.size())
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
        
        // Parse date strings to LocalDate for order date comparison
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);
        
        // Get all payout items for this admin
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(adminId, RecipientType.ADMIN);
        
        // Filter by order date range instead of accrued_at
        List<PayoutOrderItem> payoutItems = allPayoutItems.stream()
                .filter(item -> {
                    if (item.getOrderItem() == null || 
                        item.getOrderItem().getOrder() == null || 
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                })
                .collect(Collectors.toList());
        
        log.info("Found {} payout items for admin {} in date range", payoutItems.size(), adminId);
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        payoutItems = deduplicatePayoutItems(payoutItems);
        
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
        
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = payoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        countableItems = deduplicatePayoutItems(countableItems);
        
        // Get unique counts from filtered items
        Set<String> uniqueTeachers = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        
        for (PayoutOrderItem item : countableItems) {
            var course = item.getOrderItem().getCourse();
            uniqueCourses.add(course.getId());
            uniqueOrderItemIds.add(item.getOrderItem().getId());

            String teacherId1 = teacherRepository.getTeacherByTeacherId(course.getCourse().getIdTeacher()).getResult().getId();
            if (teacherId1 != null) {
                uniqueTeachers.add(teacherId1);
            }
            
            uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
        }
        
        // Track refunds
        Set<Integer> refundedOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();
        
        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();
            
            if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                refundedOrderItemIds.add(orderItemId);
                orderToRefundedItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            } else if (isCountableRevenue(item.getStatus())) {
                orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            }
        }
        
        // Classify orders
        Set<Integer> allOrdersWithRefunds = new HashSet<>(orderToRefundedItems.keySet());
        Set<Integer> partiallyRefundedOrders = new HashSet<>();
        Set<Integer> fullyRefundedOrders = new HashSet<>();
        
        for (Integer orderId : allOrdersWithRefunds) {
            boolean hasValidItems = orderToValidItems.containsKey(orderId) && !orderToValidItems.get(orderId).isEmpty();
            if (hasValidItems) {
                partiallyRefundedOrders.add(orderId);
            } else {
                fullyRefundedOrders.add(orderId);
            }
        }
        
        // Get unique orders from valid items
        Set<Integer> uniqueOrders = new HashSet<>();
        for (PayoutOrderItem item : countableItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
        }
        
        // Group by teacher for teacher revenue details (filtered by date)
        List<AdminRevenueResponse.TeacherRevenueDetail> teacherDetails = new ArrayList<>();
        
        for (String teacherId : uniqueTeachers) {
            // Get payout items for this TEACHER filtered by order date range
            List<PayoutOrderItem> allTeacherPayoutItems = payoutOrderItemRepository
                    .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER);
            
            List<PayoutOrderItem> teacherPayoutItems = allTeacherPayoutItems.stream()
                    .filter(item -> {
                        if (item.getOrderItem() == null || 
                            item.getOrderItem().getOrder() == null || 
                            item.getOrderItem().getOrder().getOrderDate() == null) {
                            return false;
                        }
                        LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                        return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                    })
                    .filter(item -> isCountableRevenue(item.getStatus()))
                    .collect(Collectors.toList());
            
            // Deduplicate to handle duplicate PayoutOrderItems in database
            teacherPayoutItems = deduplicatePayoutItems(teacherPayoutItems);
            
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
        List<AdminRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForAdmin(countableItems);
        
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
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(allOrdersWithRefunds.size())
                .totalPartiallyRefundedOrders(partiallyRefundedOrders.size())
                .totalFullyRefundedOrders(fullyRefundedOrders.size())
                .totalOrderItems(uniqueOrderItemIds.size())
                .totalRefundedItems(refundedOrderItemIds.size())
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
        
        // Get all payout items to calculate gross revenue
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository.findAll();
        
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = allPayoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        countableItems = deduplicatePayoutItems(countableItems);
        
        BigDecimal totalGrossRevenue = countableItems.stream()
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTeacherRevenue = countableItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAdminRevenue = countableItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.SUPER_ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(10.0);
        
        // Group by month
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(countableItems, allPayoutItems);
        
        // Count unique courses, students and orders
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>(); // Track unique order items
        
        for (PayoutOrderItem item : countableItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getCourse() != null) {
                uniqueCourses.add(item.getOrderItem().getCourse().getId());
            }
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
                uniqueOrders.add(item.getOrderItem().getOrder().getId());
                uniqueOrderItemIds.add(item.getOrderItem().getId());
            }
        }
        
        // Track refunded items and orders
        Set<Integer> refundedOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();
        
        // Build maps for refund analysis
        for (PayoutOrderItem item : allPayoutItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                Integer orderId = item.getOrderItem().getOrder().getId();
                Integer orderItemId = item.getOrderItem().getId();
                
                if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                    item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                    refundedOrderItemIds.add(orderItemId);
                    orderToRefundedItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
                } else if (isCountableRevenue(item.getStatus())) {
                    orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
                }
            }
        }
        
        // Classify orders: partially vs fully refunded
        Set<Integer> allOrdersWithRefunds = new HashSet<>(orderToRefundedItems.keySet());
        Set<Integer> partiallyRefundedOrders = new HashSet<>();
        Set<Integer> fullyRefundedOrders = new HashSet<>();
        
        for (Integer orderId : allOrdersWithRefunds) {
            boolean hasValidItems = orderToValidItems.containsKey(orderId) && !orderToValidItems.get(orderId).isEmpty();
            if (hasValidItems) {
                partiallyRefundedOrders.add(orderId);
            } else {
                fullyRefundedOrders.add(orderId);
            }
        }
        
        // Calculate system revenue as 10% of gross revenue (handles escrow items)
        BigDecimal calculatedSystemRevenue = totalGrossRevenue
                .multiply(BigDecimal.valueOf(sharePercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        return SystemRevenueResponse.builder()
                .totalRevenue(calculatedSystemRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalGrossRevenue(totalGrossRevenue)
                .totalTeacherRevenue(totalTeacherRevenue)
                .totalAdminRevenue(totalAdminRevenue)
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(allOrdersWithRefunds.size())
                .totalPartiallyRefundedOrders(partiallyRefundedOrders.size())
                .totalFullyRefundedOrders(fullyRefundedOrders.size())
                .totalOrderItems(uniqueOrderItemIds.size())
                .totalRefundedItems(refundedOrderItemIds.size())
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
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);
        
        // Get all payout items for SUPER_ADMIN (system) within date range based on order date
        List<PayoutOrderItem> systemPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType("SYSTEM", RecipientType.SUPER_ADMIN)
                .stream()
                .filter(item -> {
                    if (item.getOrderItem() == null || 
                        item.getOrderItem().getOrder() == null || 
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
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
        
        // Get all payout items within date range based on order date to calculate gross revenue
        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository.findAll().stream()
                .filter(item -> {
                    if (item.getOrderItem() == null || 
                        item.getOrderItem().getOrder() == null || 
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                })
                .collect(Collectors.toList());
        
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = allPayoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        countableItems = deduplicatePayoutItems(countableItems);
        
        BigDecimal totalGrossRevenue = countableItems.stream()
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTeacherRevenue = countableItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAdminRevenue = countableItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get share percentage
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.SUPER_ADMIN)
                .map(config -> config.getSharePercentage())
                .orElse(10.0);
        
        // Group by month
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(countableItems, allPayoutItems);
        
        // Count unique courses, students and orders from filtered items
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        
        for (PayoutOrderItem item : countableItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getCourse() != null) {
                uniqueCourses.add(item.getOrderItem().getCourse().getId());
            }
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
                uniqueOrders.add(item.getOrderItem().getOrder().getId());
                uniqueOrderItemIds.add(item.getOrderItem().getId());
            }
        }
        
        // Track refunded items and orders
        Set<Integer> refundedOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();
        
        // Build maps for refund analysis
        for (PayoutOrderItem item : allPayoutItems) {
            if (item.getOrderItem() != null && item.getOrderItem().getOrder() != null) {
                Integer orderId = item.getOrderItem().getOrder().getId();
                Integer orderItemId = item.getOrderItem().getId();
                
                if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                    item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                    refundedOrderItemIds.add(orderItemId);
                    orderToRefundedItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
                } else if (isCountableRevenue(item.getStatus())) {
                    orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
                }
            }
        }
        
        // Classify orders: partially vs fully refunded
        Set<Integer> allOrdersWithRefunds = new HashSet<>(orderToRefundedItems.keySet());
        Set<Integer> partiallyRefundedOrders = new HashSet<>();
        Set<Integer> fullyRefundedOrders = new HashSet<>();
        
        for (Integer orderId : allOrdersWithRefunds) {
            boolean hasValidItems = orderToValidItems.containsKey(orderId) && !orderToValidItems.get(orderId).isEmpty();
            if (hasValidItems) {
                partiallyRefundedOrders.add(orderId);
            } else {
                fullyRefundedOrders.add(orderId);
            }
        }
        
        // Calculate system revenue as 10% of gross revenue (handles escrow items)
        BigDecimal calculatedSystemRevenue = totalGrossRevenue
                .multiply(BigDecimal.valueOf(sharePercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        return SystemRevenueResponse.builder()
                .totalRevenue(calculatedSystemRevenue)
                .totalAccrued(totalAccrued)
                .totalSettled(totalSettled)
                .totalGrossRevenue(totalGrossRevenue)
                .totalTeacherRevenue(totalTeacherRevenue)
                .totalAdminRevenue(totalAdminRevenue)
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(allOrdersWithRefunds.size())
                .totalPartiallyRefundedOrders(partiallyRefundedOrders.size())
                .totalFullyRefundedOrders(fullyRefundedOrders.size())
                .totalOrderItems(uniqueOrderItemIds.size())
                .totalRefundedItems(refundedOrderItemIds.size())
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
        
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);
        
        // Get all unique teacher IDs from items within order date range
        List<String> teacherIds = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .filter(item -> {
                    if (item.getOrderItem() == null || 
                        item.getOrderItem().getOrder() == null || 
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                })
                .map(PayoutOrderItem::getRecipientId)
                .distinct()
                .collect(Collectors.toList());
        
        return teacherIds.stream()
                .map(teacherId -> getTeacherRevenueByTeacherIdAndRange(teacherId, startLocalDate, endLocalDate))
                .filter(response -> response.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0) // Only include teachers with revenue
                .collect(Collectors.toList());
    }
    
    private TeacherRevenueResponse getTeacherRevenueByTeacherIdAndRange(String teacherId, LocalDate startLocalDate, LocalDate endLocalDate) {
        log.info("Getting revenue for teacher ID: {} from {} to {}", teacherId, startLocalDate, endLocalDate);
        
        // Get all payout items for this teacher within order date range
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(teacherId, RecipientType.TEACHER)
                .stream()
                .filter(item -> {
                    if (item.getOrderItem() == null || 
                        item.getOrderItem().getOrder() == null || 
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                })
                .collect(Collectors.toList());
        
        // Deduplicate to handle duplicate PayoutOrderItems in database
        payoutItems = deduplicatePayoutItems(payoutItems);
        
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
        
        BigDecimal totalReversed = payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                              item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT)
                .map(PayoutOrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders, courses, items and track refunds
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        Set<Integer> refundedOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();
        
        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();
            
            uniqueOrders.add(orderId);
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
            
            // Track order items and refunds
            if (item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {
                refundedOrderItemIds.add(orderItemId);
                orderToRefundedItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            } else if (isCountableRevenue(item.getStatus())) {
                uniqueOrderItemIds.add(orderItemId);
                orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            }
        }
        
        // Classify orders: partially vs fully refunded
        Set<Integer> allOrdersWithRefunds = new HashSet<>(orderToRefundedItems.keySet());
        Set<Integer> partiallyRefundedOrders = new HashSet<>();
        Set<Integer> fullyRefundedOrders = new HashSet<>();
        
        for (Integer orderId : allOrdersWithRefunds) {
            boolean hasValidItems = orderToValidItems.containsKey(orderId) && !orderToValidItems.get(orderId).isEmpty();
            if (hasValidItems) {
                partiallyRefundedOrders.add(orderId);
            } else {
                fullyRefundedOrders.add(orderId);
            }
        }
        
        // Get share percentage from config
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);
        
        // Group by course for course revenue details (exclude non-countable items for net revenue)
        Map<Integer, List<PayoutOrderItem>> itemsByCourse = payoutItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
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
        
        // Get refund details
        List<TeacherRevenueResponse.RefundDetail> refundDetails = buildRefundDetails(payoutItems);
        
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
                .totalReversed(totalReversed)
                .totalCoursesSold(uniqueCourses.size())
                .totalStudents(uniqueStudents.size())
                .totalOrders(uniqueOrders.size())
                .totalRefundedOrders(allOrdersWithRefunds.size())
                .totalPartiallyRefundedOrders(partiallyRefundedOrders.size())
                .totalFullyRefundedOrders(fullyRefundedOrders.size())
                .totalOrderItems(uniqueOrderItemIds.size())
                .totalRefundedItems(refundedOrderItemIds.size())
                .sharePercentage(sharePercentage)
                .courseRevenueDetails(courseDetails)
                .monthlyRevenueDetails(monthlyDetails)
                .refundDetails(refundDetails)
                .build();
    }

    public List<AdminRevenueResponse> getAllAdminsRevenue() {
        // Similar to getAllTeachersRevenue but for admins
        return new ArrayList<>(); // TODO: Implement
    }
    
    
    private List<TeacherRevenueResponse.MonthlyRevenueDetail> groupByMonth(List<PayoutOrderItem> items) {
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = items.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());
        
        Map<String, List<PayoutOrderItem>> itemsByMonth = countableItems.stream()
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
    
    private List<SystemRevenueResponse.MonthlyRevenueDetail> groupByMonthForSystem(List<PayoutOrderItem> countableItems, List<PayoutOrderItem> allItems) {
        // Group by order date instead of accrued_at to show revenue in the correct month
        Map<String, List<PayoutOrderItem>> itemsByMonth = countableItems.stream()
                .filter(item -> item.getOrderItem() != null && 
                              item.getOrderItem().getOrder() != null && 
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    java.sql.Date orderDate = item.getOrderItem().getOrder().getOrderDate();
                    LocalDate localDate = orderDate.toLocalDate();
                    return localDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                }));
        
        // Group refunded items by order date
        Map<String, List<PayoutOrderItem>> refundedItemsByMonth = allItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                              item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT)
                .filter(item -> item.getOrderItem() != null && 
                              item.getOrderItem().getOrder() != null && 
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    java.sql.Date orderDate = item.getOrderItem().getOrder().getOrderDate();
                    LocalDate localDate = orderDate.toLocalDate();
                    return localDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                }));
        
        return itemsByMonth.entrySet().stream()
                .map(entry -> {
                    // Deduplicate PayoutOrderItems for this month
                    List<PayoutOrderItem> uniqueItems = deduplicatePayoutItems(entry.getValue());
                    
                    BigDecimal grossRevenue = uniqueItems.stream()
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal teacherRevenue = uniqueItems.stream()
                            .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal adminRevenue = uniqueItems.stream()
                            .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal systemRevenue = uniqueItems.stream()
                            .filter(item -> item.getRecipientType() == RecipientType.SUPER_ADMIN)
                            .map(PayoutOrderItem::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    // Count unique orders for this month (use deduplicated items)
                    Set<Integer> uniqueMonthOrders = uniqueItems.stream()
                            .filter(item -> item.getOrderItem() != null && item.getOrderItem().getOrder() != null)
                            .map(item -> item.getOrderItem().getOrder().getId())
                            .collect(Collectors.toSet());
                    
                    // Count unique refunded orders for this month
                    int refundCount = 0;
                    if (refundedItemsByMonth.containsKey(entry.getKey())) {
                        Set<Integer> refundedOrders = refundedItemsByMonth.get(entry.getKey()).stream()
                                .filter(item -> item.getOrderItem() != null && item.getOrderItem().getOrder() != null)
                                .map(item -> item.getOrderItem().getOrder().getId())
                                .collect(Collectors.toSet());
                        refundCount = refundedOrders.size();
                    }
                    
                    return SystemRevenueResponse.MonthlyRevenueDetail.builder()
                            .month(entry.getKey())
                            .grossRevenue(grossRevenue)
                            .systemRevenue(systemRevenue)
                            .teacherRevenue(teacherRevenue)
                            .adminRevenue(adminRevenue)
                            .orders(uniqueMonthOrders.size())
                            .refunds(refundCount)
                            .build();
                })
                .sorted(Comparator.comparing(SystemRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
    
    private List<TeacherRevenueResponse.RefundDetail> buildRefundDetails(List<PayoutOrderItem> payoutItems) {
        return payoutItems.stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.REVERSED ||
                              item.getStatus() == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT)
                .map(item -> {
                    var orderItem = item.getOrderItem();
                    var order = orderItem.getOrder();
                    var course = orderItem.getCourse();
                    
                    // Get refunded date (use settledAt if available, otherwise accruedAt)
                    LocalDateTime refundedDate = item.getSettledAt() != null ? 
                            item.getSettledAt() : item.getAccruedAt();
                    
                    // Fetch buyer info from identity service
                    String buyerId = order.getIdUser();
                    String buyerName = "User " + buyerId; // Default fallback
                    
                    try {
                        var userResponse = userRepository.getUserById(buyerId);
                        if (userResponse != null && userResponse.getResult() != null) {
                            var user = userResponse.getResult();
                            if (user.getFirstName() != null && user.getLastName() != null) {
                                buyerName = user.getFirstName() + " " + user.getLastName();
                            } else if (user.getUsername() != null) {
                                buyerName = user.getUsername();
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to get buyer name for ID {}: {}", buyerId, e.getMessage());
                    }
                    
                    return TeacherRevenueResponse.RefundDetail.builder()
                            .orderItemId(orderItem.getId())
                            .orderId(order.getId())
                            .courseId(course.getId())
                            .courseName(course.getCourseName())
                            .courseThumbnail(course.getCourseImage())
                            .buyerId(buyerId)
                            .buyerName(buyerName)
                            .refundedAmount(item.getAmount())
                            .refundedAt(refundedDate != null ? refundedDate.toString() : null)
                            .refundStatus(item.getStatus().name())
                            .build();
                })
                .sorted(Comparator.comparing(TeacherRevenueResponse.RefundDetail::getRefundedAt, 
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }
}
