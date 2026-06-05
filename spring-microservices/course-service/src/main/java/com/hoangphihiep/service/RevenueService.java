package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.AdminRevenueResponse;
import com.hoangphihiep.dto.response.SystemRevenueResponse;
import com.hoangphihiep.dto.response.TeacherRevenueResponse;
import com.hoangphihiep.entity.PayoutOrderItem;
import com.hoangphihiep.repository.EducationalUnitRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RevenueService {
    
    private final PayoutOrderItemRepository payoutOrderItemRepository;
    private final RevenueShareConfigRepository revenueShareConfigRepository;
    private final EducationalUnitRepository educationalUnitRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final com.hoangphihiep.repository.ReviewRepository reviewRepository;

    private boolean isCountableRevenue(PayoutOrderItemStatus status) {
        return status == PayoutOrderItemStatus.ACCRUED ||
               status == PayoutOrderItemStatus.ATTACHED_TO_PAYOUT ||
               status == PayoutOrderItemStatus.SETTLED;
    }

    private boolean isRefundedStatus(PayoutOrderItemStatus status) {
        return status == PayoutOrderItemStatus.REFUNDED ||
               status == PayoutOrderItemStatus.REVERSED ||
               status == PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT;
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

    private List<PayoutOrderItem> getSystemPayoutItems() {
        List<PayoutOrderItem> systemItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType("SYSTEM", RecipientType.SUPER_ADMIN);
        return deduplicatePayoutItems(systemItems);
    }

    private List<PayoutOrderItem> getSystemPayoutItemsByOrderDateRange(LocalDate startDate, LocalDate endDate) {
        List<PayoutOrderItem> systemItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType("SYSTEM", RecipientType.SUPER_ADMIN)
                .stream()
                .filter(item -> {
                    if (item.getOrderItem() == null ||
                        item.getOrderItem().getOrder() == null ||
                        item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startDate) && !orderDate.isAfter(endDate);
                })
                .collect(Collectors.toList());
        return deduplicatePayoutItems(systemItems);
    }

    private String resolveTeacherCourseOwnerId(String teacherUserId) {
        try {
            var response = teacherRepository.getTeacherByUserId(teacherUserId);
            if (response != null && response.getResult() != null) {
                var teacher = response.getResult();
                if (teacher.getTeacherId() != null && !teacher.getTeacherId().isBlank()) {
                    return teacher.getTeacherId();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve teacherId by userId {}: {}", teacherUserId, e.getMessage());
        }

        // Fallback: if caller already passes teacherId format, keep it.
        return teacherUserId;
    }

        private List<PayoutOrderItem> getTeacherScopedRefundSourceItems(String teacherCourseOwnerId, List<PayoutOrderItem> systemItems) {
        return systemItems.stream()
            .filter(item -> isRefundedStatus(item.getStatus()))
            .filter(item -> item.getOrderItem() != null &&
                item.getOrderItem().getCourse() != null &&
                item.getOrderItem().getCourse().getCourse() != null)
            .filter(item -> teacherCourseOwnerId.equals(item.getOrderItem().getCourse().getCourse().getIdTeacher()))
            .collect(Collectors.toList());
        }

        private List<PayoutOrderItem> getAdminScopedRefundSourceItems(String adminId, List<PayoutOrderItem> systemItems) {
        return systemItems.stream()
            .filter(item -> isRefundedStatus(item.getStatus()))
            .filter(item -> item.getOrderItem() != null &&
                item.getOrderItem().getCourse() != null &&
                item.getOrderItem().getCourse().getCourse() != null &&
                item.getOrderItem().getCourse().getCourse().getEducationalUnit() != null)
            .filter(item -> adminId.equals(item.getOrderItem().getCourse().getCourse().getEducationalUnit().getIdAdmin()))
            .collect(Collectors.toList());
        }

        private Set<Integer> getRefundedOrderItemIds(List<PayoutOrderItem> refundSourceItems) {
        return refundSourceItems.stream()
            .filter(item -> item.getOrderItem() != null)
            .map(item -> item.getOrderItem().getId())
            .collect(Collectors.toSet());
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
        
        String teacherCourseOwnerId = resolveTeacherCourseOwnerId(teacherId);
        List<PayoutOrderItem> systemPayoutItems = getSystemPayoutItems();
        List<PayoutOrderItem> refundSourceItems = getTeacherScopedRefundSourceItems(teacherCourseOwnerId, systemPayoutItems);
        Set<Integer> refundedOrderItemIds = getRefundedOrderItemIds(refundSourceItems);

        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders, courses, items and track refunds
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();

        for (PayoutOrderItem refundItem : refundSourceItems) {
            if (refundItem.getOrderItem() == null || refundItem.getOrderItem().getOrder() == null) {
                continue;
            }
            Integer refundOrderId = refundItem.getOrderItem().getOrder().getId();
            Integer refundOrderItemId = refundItem.getOrderItem().getId();
            orderToRefundedItems.computeIfAbsent(refundOrderId, k -> new HashSet<>()).add(refundOrderItemId);
        }
        
        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();

            uniqueOrders.add(orderId);
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());

            if (isCountableRevenue(item.getStatus()) && !refundedOrderItemIds.contains(orderItemId)) {
                uniqueOrderItemIds.add(orderItemId);
                orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            }
        }

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
                    .courseName(course.getCourseName()) // Changed from courseTitle
                    .courseThumbnail(course.getCourseImage())
                    .revenue(courseRevenue) // Changed from totalRevenue
                    .totalSales(entry.getValue().size())
                    .totalStudents(entry.getValue().size()) // Simplified
                    .averageRating(averageRating != null ? averageRating : 0.0)
                    .build());
        }
        
        // Group by month for monthly revenue details
        List<TeacherRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonth(payoutItems, refundSourceItems, false);
        
        // Get refund details
        List<TeacherRevenueResponse.RefundDetail> refundDetails = buildRefundDetails(payoutItems, refundSourceItems);
        BigDecimal totalReversed = refundDetails.stream()
                .map(TeacherRevenueResponse.RefundDetail::getRefundedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
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

    public TeacherRevenueResponse getTeacherRevenueByRange(String startDate, String endDate) {
        String teacherId = JwtUtils.getCurrentUserId();
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);
        return getTeacherRevenueByTeacherIdAndRange(teacherId, startLocalDate, endLocalDate);
    }


    public AdminRevenueResponse getAdminRevenue() {
        return getAdminRevenueByAdminId(JwtUtils.getCurrentUserId(), null, null);
    }

    public AdminRevenueResponse getAdminRevenueByRange(String startDate, String endDate) {
        return getAdminRevenueByAdminId(
                JwtUtils.getCurrentUserId(),
                LocalDate.parse(startDate),
                LocalDate.parse(endDate));
    }

    private AdminRevenueResponse getAdminRevenueByAdminId(
            String adminId,
            LocalDate startLocalDate,
            LocalDate endLocalDate) {
        boolean hasDateRange = startLocalDate != null && endLocalDate != null;
        if (hasDateRange) {
            log.info("Getting revenue for admin ID: {} from {} to {}", adminId, startLocalDate, endLocalDate);
        } else {
            log.info("Getting revenue for admin ID: {}", adminId);
        }

        List<PayoutOrderItem> allPayoutItems = payoutOrderItemRepository
                .findByRecipientIdAndRecipientType(adminId, RecipientType.ADMIN);

        List<PayoutOrderItem> payoutItems = allPayoutItems;
        if (hasDateRange) {
            payoutItems = allPayoutItems.stream()
                    .filter(item -> {
                        if (item.getOrderItem() == null
                                || item.getOrderItem().getOrder() == null
                                || item.getOrderItem().getOrder().getOrderDate() == null) {
                            return false;
                        }
                        LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                        return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                    })
                    .collect(Collectors.toList());
        }

        log.info("Found {} payout items for admin {}", payoutItems.size(), adminId);

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
        
        List<PayoutOrderItem> systemPayoutItems = hasDateRange
                ? getSystemPayoutItemsByOrderDateRange(startLocalDate, endLocalDate)
                : getSystemPayoutItems();
        List<PayoutOrderItem> refundSourceItems = getAdminScopedRefundSourceItems(adminId, systemPayoutItems);
        Set<Integer> refundedOrderItemIds = getRefundedOrderItemIds(refundSourceItems);

        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();

        for (PayoutOrderItem refundItem : refundSourceItems) {
            if (refundItem.getOrderItem() == null || refundItem.getOrderItem().getOrder() == null) {
                continue;
            }
            Integer refundOrderId = refundItem.getOrderItem().getOrder().getId();
            Integer refundOrderItemId = refundItem.getOrderItem().getId();
            orderToRefundedItems.computeIfAbsent(refundOrderId, k -> new HashSet<>()).add(refundOrderItemId);
        }

        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();

            if (isCountableRevenue(item.getStatus()) && !refundedOrderItemIds.contains(orderItemId)) {
                orderToValidItems.computeIfAbsent(orderId, k -> new HashSet<>()).add(orderItemId);
            }
        }

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

        Set<Integer> uniqueOrders = new HashSet<>();
        for (PayoutOrderItem item : countableItems) {
            uniqueOrders.add(item.getOrderItem().getOrder().getId());
        }

        List<AdminRevenueResponse.TeacherRevenueDetail> teacherDetails = new ArrayList<>();

        for (String teacherId : uniqueTeachers) {
            List<PayoutOrderItem> teacherAdminItems = countableItems.stream()
                    .filter(item -> {
                        var course = item.getOrderItem().getCourse();
                        if (course == null || course.getCourse() == null) {
                            return false;
                        }
                        String ownerTeacherId = teacherRepository
                                .getTeacherByTeacherId(course.getCourse().getIdTeacher())
                                .getResult()
                                .getId();
                        return teacherId.equals(ownerTeacherId);
                    })
                    .collect(Collectors.toList());

            if (teacherAdminItems.isEmpty()) {
                continue;
            }

            BigDecimal adminRevenueByTeacher = teacherAdminItems.stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Set<Integer> teacherCourses = teacherAdminItems.stream()
                    .map(item -> item.getOrderItem().getCourse().getId())
                    .collect(Collectors.toSet());

            Set<String> teacherStudents = teacherAdminItems.stream()
                    .map(item -> item.getOrderItem().getOrder().getIdUser())
                    .collect(Collectors.toSet());

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
                    .revenue(adminRevenueByTeacher)
                    .courseCount(teacherCourses.size())
                    .studentCount(teacherStudents.size())
                    .averageRating(averageRating)
                    .build());
        }

        teacherDetails.sort((a, b) -> b.getRevenue().compareTo(a.getRevenue()));

        boolean useDailyBucket = hasDateRange
                && ChronoUnit.DAYS.between(startLocalDate, endLocalDate) <= 31;
        List<AdminRevenueResponse.MonthlyRevenueDetail> monthlyDetails =
                groupByMonthForAdmin(countableItems, refundSourceItems, useDailyBucket);

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
                .educationalUnitName(resolveEducationalUnitName(payoutItems, adminId))
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
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(countableItems, allPayoutItems, false);
        
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
                
                if (isRefundedStatus(item.getStatus())) {
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
                .totalTeachers(countUniqueTeachers(countableItems))
                .totalEducationalUnits(countEducationalUnits())
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
        boolean useDailyBucket = ChronoUnit.DAYS.between(startLocalDate, endLocalDate) <= 31;
        List<SystemRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonthForSystem(countableItems, allPayoutItems, useDailyBucket);
        
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
                
                if (isRefundedStatus(item.getStatus())) {
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
                .totalTeachers(countUniqueTeachers(countableItems))
                .totalEducationalUnits(countEducationalUnits())
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
        
        String teacherCourseOwnerId = resolveTeacherCourseOwnerId(teacherId);
        List<PayoutOrderItem> systemPayoutItems = getSystemPayoutItemsByOrderDateRange(startLocalDate, endLocalDate);
        List<PayoutOrderItem> refundSourceItems = getTeacherScopedRefundSourceItems(teacherCourseOwnerId, systemPayoutItems);
        Set<Integer> refundedOrderItemIds = getRefundedOrderItemIds(refundSourceItems);

        BigDecimal totalRevenue = totalAccrued.add(totalSettled);
        
        // Get unique orders, courses, items and track refunds
        Set<Integer> uniqueOrders = new HashSet<>();
        Set<Integer> uniqueCourses = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<Integer> uniqueOrderItemIds = new HashSet<>();
        Map<Integer, Set<Integer>> orderToRefundedItems = new HashMap<>();
        Map<Integer, Set<Integer>> orderToValidItems = new HashMap<>();

        for (PayoutOrderItem refundItem : refundSourceItems) {
            if (refundItem.getOrderItem() == null || refundItem.getOrderItem().getOrder() == null) {
                continue;
            }
            Integer refundOrderId = refundItem.getOrderItem().getOrder().getId();
            Integer refundOrderItemId = refundItem.getOrderItem().getId();
            orderToRefundedItems.computeIfAbsent(refundOrderId, k -> new HashSet<>()).add(refundOrderItemId);
        }
        
        for (PayoutOrderItem item : payoutItems) {
            Integer orderId = item.getOrderItem().getOrder().getId();
            Integer orderItemId = item.getOrderItem().getId();
            
            uniqueOrders.add(orderId);
            uniqueCourses.add(item.getOrderItem().getCourse().getId());
            uniqueStudents.add(item.getOrderItem().getOrder().getIdUser());
            
            // Track order items and refunds
            if (isCountableRevenue(item.getStatus()) && !refundedOrderItemIds.contains(orderItemId)) {
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
        
        // Group by period for revenue details
        boolean useDailyBucket = ChronoUnit.DAYS.between(startLocalDate, endLocalDate) <= 31;
        List<TeacherRevenueResponse.MonthlyRevenueDetail> monthlyDetails = groupByMonth(payoutItems, refundSourceItems, useDailyBucket);
        
        // Get refund details
        List<TeacherRevenueResponse.RefundDetail> refundDetails = buildRefundDetails(payoutItems, refundSourceItems);
        BigDecimal totalReversed = refundDetails.stream()
                .map(TeacherRevenueResponse.RefundDetail::getRefundedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
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
        List<String> adminIds = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.ADMIN)
                .map(PayoutOrderItem::getRecipientId)
                .distinct()
                .collect(Collectors.toList());

        return adminIds.stream()
                .map(adminId -> getAdminRevenueByAdminId(adminId, null, null))
                .sorted((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()))
                .collect(Collectors.toList());
    }

    public List<TeacherRevenueResponse.CourseRevenueDetail> getAllCoursesRevenue() {
        List<PayoutOrderItem> teacherItems = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .collect(Collectors.toList());
        return buildAllCoursesRevenue(teacherItems);
    }

    public List<TeacherRevenueResponse.CourseRevenueDetail> getAllCoursesRevenueByRange(String startDate, String endDate) {
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);

        List<PayoutOrderItem> teacherItems = payoutOrderItemRepository.findAll().stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .filter(item -> {
                    if (item.getOrderItem() == null
                            || item.getOrderItem().getOrder() == null
                            || item.getOrderItem().getOrder().getOrderDate() == null) {
                        return false;
                    }
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return !orderDate.isBefore(startLocalDate) && !orderDate.isAfter(endLocalDate);
                })
                .collect(Collectors.toList());
        return buildAllCoursesRevenue(teacherItems);
    }

    private List<TeacherRevenueResponse.CourseRevenueDetail> buildAllCoursesRevenue(List<PayoutOrderItem> teacherItems) {
        List<PayoutOrderItem> countableItems = deduplicatePayoutItems(teacherItems.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .filter(item -> item.getOrderItem() != null && item.getOrderItem().getCourse() != null)
                .collect(Collectors.toList()));

        Map<Integer, List<PayoutOrderItem>> itemsByCourse = countableItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrderItem().getCourse().getId()));

        List<TeacherRevenueResponse.CourseRevenueDetail> courseDetails = new ArrayList<>();
        for (Map.Entry<Integer, List<PayoutOrderItem>> entry : itemsByCourse.entrySet()) {
            var course = entry.getValue().get(0).getOrderItem().getCourse();
            BigDecimal courseRevenue = entry.getValue().stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Set<String> uniqueStudents = entry.getValue().stream()
                    .filter(item -> item.getOrderItem().getOrder() != null)
                    .map(item -> item.getOrderItem().getOrder().getIdUser())
                    .collect(Collectors.toSet());

            Double averageRating = reviewRepository.getAverageRatingByCourseId(course.getId());

            courseDetails.add(TeacherRevenueResponse.CourseRevenueDetail.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName())
                    .courseThumbnail(course.getCourseImage())
                    .revenue(courseRevenue)
                    .totalSales(entry.getValue().size())
                    .totalStudents(uniqueStudents.size())
                    .averageRating(averageRating != null ? averageRating : 0.0)
                    .build());
        }

        courseDetails.sort((a, b) -> b.getRevenue().compareTo(a.getRevenue()));
        return courseDetails;
    }

    private int countUniqueTeachers(List<PayoutOrderItem> countableItems) {
        return (int) countableItems.stream()
                .filter(item -> item.getRecipientType() == RecipientType.TEACHER)
                .map(PayoutOrderItem::getRecipientId)
                .distinct()
                .count();
    }

    private int countEducationalUnits() {
        Long count = educationalUnitRepository.countTotalOrganizations("ALL");
        return count != null ? count.intValue() : 0;
    }
    
    
        private List<TeacherRevenueResponse.MonthlyRevenueDetail> groupByMonth(
            List<PayoutOrderItem> items,
            List<PayoutOrderItem> refundSourceItems,
            boolean useDailyBucket
        ) {
        // Filter for countable revenue items (exclude HELD, RELEASED, REFUNDED, REVERSED)
        List<PayoutOrderItem> countableItems = items.stream()
                .filter(item -> isCountableRevenue(item.getStatus()))
                .collect(Collectors.toList());

        DateTimeFormatter periodFormatter = useDailyBucket
                ? DateTimeFormatter.ofPattern("yyyy-MM-dd")
                : DateTimeFormatter.ofPattern("yyyy-MM");
        
        Map<String, List<PayoutOrderItem>> itemsByMonth = countableItems.stream()
                .filter(item -> item.getOrderItem() != null &&
                              item.getOrderItem().getOrder() != null &&
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return orderDate.format(periodFormatter);
                }));
        
        Map<String, Integer> refundedOrdersByMonth = refundSourceItems.stream()
            .filter(item -> item.getOrderItem() != null &&
                      item.getOrderItem().getOrder() != null &&
                      item.getOrderItem().getOrder().getOrderDate() != null)
            .collect(Collectors.groupingBy(
                item -> {
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return orderDate.format(periodFormatter);
                },
                Collectors.collectingAndThen(
                    Collectors.mapping(item -> item.getOrderItem().getOrder().getId(), Collectors.toSet()),
                    Set::size
                )
            ));

        Set<String> allPeriods = new HashSet<>();
        allPeriods.addAll(itemsByMonth.keySet());
        allPeriods.addAll(refundedOrdersByMonth.keySet());

        return allPeriods.stream()
            .map(period -> TeacherRevenueResponse.MonthlyRevenueDetail.builder()
                .month(period)
                .revenue(itemsByMonth.getOrDefault(period, List.of()).stream()
                    .map(PayoutOrderItem::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add))
                .orderCount(itemsByMonth.getOrDefault(period, List.of()).size())
                .refundedOrders(refundedOrdersByMonth.getOrDefault(period, 0))
                .build())
                .sorted(Comparator.comparing(TeacherRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
    
        private List<AdminRevenueResponse.MonthlyRevenueDetail> groupByMonthForAdmin(
            List<PayoutOrderItem> countableItems,
            List<PayoutOrderItem> allItems,
            boolean useDailyBucket
        ) {
        DateTimeFormatter periodFormatter = useDailyBucket
                ? DateTimeFormatter.ofPattern("yyyy-MM-dd")
                : DateTimeFormatter.ofPattern("yyyy-MM");

        Map<String, List<PayoutOrderItem>> itemsByMonth = countableItems.stream()
                .filter(item -> item.getOrderItem() != null &&
                              item.getOrderItem().getOrder() != null &&
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return orderDate.format(periodFormatter);
                }));

        Map<String, Integer> refundedOrdersByMonth = allItems.stream()
            .filter(item -> isRefundedStatus(item.getStatus()))
            .filter(item -> item.getOrderItem() != null &&
                      item.getOrderItem().getOrder() != null &&
                      item.getOrderItem().getOrder().getOrderDate() != null)
            .collect(Collectors.groupingBy(
                item -> {
                    LocalDate orderDate = item.getOrderItem().getOrder().getOrderDate().toLocalDate();
                    return orderDate.format(periodFormatter);
                },
                Collectors.collectingAndThen(
                    Collectors.mapping(item -> item.getOrderItem().getOrder().getId(), Collectors.toSet()),
                    Set::size
                )
            ));

        Set<String> allPeriods = new HashSet<>();
        allPeriods.addAll(itemsByMonth.keySet());
        allPeriods.addAll(refundedOrdersByMonth.keySet());
        
        return allPeriods.stream()
            .map(period -> AdminRevenueResponse.MonthlyRevenueDetail.builder()
                .month(period)
                .revenue(itemsByMonth.getOrDefault(period, List.of()).stream()
                                .map(PayoutOrderItem::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                .orderCount(itemsByMonth.getOrDefault(period, List.of()).size()) // Changed from orders
                .refundedOrders(refundedOrdersByMonth.getOrDefault(period, 0))
                        .build())
                .sorted(Comparator.comparing(AdminRevenueResponse.MonthlyRevenueDetail::getMonth))
                .collect(Collectors.toList());
    }
    
    private List<SystemRevenueResponse.MonthlyRevenueDetail> groupByMonthForSystem(
            List<PayoutOrderItem> countableItems,
            List<PayoutOrderItem> allItems,
            boolean useDailyBucket
    ) {
        DateTimeFormatter periodFormatter = useDailyBucket
                ? DateTimeFormatter.ofPattern("yyyy-MM-dd")
                : DateTimeFormatter.ofPattern("yyyy-MM");

        // Group by order date instead of accrued_at to show revenue in the correct period
        Map<String, List<PayoutOrderItem>> itemsByMonth = countableItems.stream()
                .filter(item -> item.getOrderItem() != null && 
                              item.getOrderItem().getOrder() != null && 
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    java.sql.Date orderDate = item.getOrderItem().getOrder().getOrderDate();
                    LocalDate localDate = orderDate.toLocalDate();
                    return localDate.format(periodFormatter);
                }));
        
        // Group refunded items by order date
        Map<String, List<PayoutOrderItem>> refundedItemsByMonth = allItems.stream()
            .filter(item -> isRefundedStatus(item.getStatus()))
                .filter(item -> item.getOrderItem() != null && 
                              item.getOrderItem().getOrder() != null && 
                              item.getOrderItem().getOrder().getOrderDate() != null)
                .collect(Collectors.groupingBy(item -> {
                    java.sql.Date orderDate = item.getOrderItem().getOrder().getOrderDate();
                    LocalDate localDate = orderDate.toLocalDate();
                    return localDate.format(periodFormatter);
                }));
        
        Set<String> allPeriods = new HashSet<>();
        allPeriods.addAll(itemsByMonth.keySet());
        allPeriods.addAll(refundedItemsByMonth.keySet());

        return allPeriods.stream()
            .map(period -> {
                // Deduplicate PayoutOrderItems for this period
                List<PayoutOrderItem> uniqueItems = deduplicatePayoutItems(
                    itemsByMonth.getOrDefault(period, Collections.emptyList())
                );
                    
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
                    
                        // Count unique orders for this period (use deduplicated items)
                    Set<Integer> uniqueMonthOrders = uniqueItems.stream()
                            .filter(item -> item.getOrderItem() != null && item.getOrderItem().getOrder() != null)
                            .map(item -> item.getOrderItem().getOrder().getId())
                            .collect(Collectors.toSet());
                    
                        // Count unique refunded orders for this period
                    int refundCount = 0;
                        if (refundedItemsByMonth.containsKey(period)) {
                        Set<Integer> refundedOrders = refundedItemsByMonth.get(period).stream()
                                .filter(item -> item.getOrderItem() != null && item.getOrderItem().getOrder() != null)
                                .map(item -> item.getOrderItem().getOrder().getId())
                                .collect(Collectors.toSet());
                        refundCount = refundedOrders.size();
                    }
                    
                    return SystemRevenueResponse.MonthlyRevenueDetail.builder()
                            .month(period)
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

    private String resolveEducationalUnitName(List<PayoutOrderItem> payoutItems, String adminId) {
        return payoutItems.stream()
                .filter(item -> item.getOrderItem() != null
                        && item.getOrderItem().getCourse() != null
                        && item.getOrderItem().getCourse().getCourse() != null
                        && item.getOrderItem().getCourse().getCourse().getEducationalUnit() != null)
                .map(item -> item.getOrderItem().getCourse().getCourse().getEducationalUnit())
                .filter(unit -> adminId.equals(unit.getIdAdmin()))
                .map(unit -> unit.getName() != null && !unit.getName().isBlank()
                        ? unit.getName()
                        : "Educational Unit")
                .findFirst()
                .orElse("Educational Unit");
    }
    
        private List<TeacherRevenueResponse.RefundDetail> buildRefundDetails(
            List<PayoutOrderItem> scopedPayoutItems,
            List<PayoutOrderItem> refundSourceItems
        ) {
        Map<Integer, BigDecimal> scopedAmountsByOrderItem = scopedPayoutItems.stream()
            .filter(item -> item.getOrderItem() != null)
            .collect(Collectors.toMap(
                item -> item.getOrderItem().getId(),
                PayoutOrderItem::getAmount,
                (existing, replacement) -> existing
            ));
        Double sharePercentage = revenueShareConfigRepository
                .findByRecipientTypeAndIsActiveTrue(RecipientType.TEACHER)
                .map(config -> config.getSharePercentage())
                .orElse(70.0);

        return refundSourceItems.stream()
            .filter(item -> isRefundedStatus(item.getStatus()))
            .collect(Collectors.toMap(
                item -> item.getOrderItem().getId(),
                item -> item,
                (a, b) -> a.getId() > b.getId() ? a : b
            ))
            .values().stream()
                .map(item -> {
                    var orderItem = item.getOrderItem();
                    var order = orderItem.getOrder();
                    var course = orderItem.getCourse();
                    
                    LocalDateTime refundedDate = item.getRefundedAt() != null
                            ? item.getRefundedAt()
                            : (item.getSettledAt() != null ? item.getSettledAt() : item.getAccruedAt());
                    
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
                            .refundedAmount(resolveScopedRefundAmount(item, scopedAmountsByOrderItem, sharePercentage))
                            .refundedAt(refundedDate != null ? refundedDate.toString() : null)
                            .refundStatus(item.getStatus().name())
                            .build();
                })
                .sorted(Comparator.comparing(TeacherRevenueResponse.RefundDetail::getRefundedAt, 
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    private BigDecimal resolveScopedRefundAmount(
            PayoutOrderItem refundItem,
            Map<Integer, BigDecimal> scopedAmountsByOrderItem,
            Double sharePercentage
    ) {
        if (refundItem.getOrderItem() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal scopedAmount = scopedAmountsByOrderItem.get(refundItem.getOrderItem().getId());
        if (scopedAmount != null) {
            return scopedAmount;
        }

        BigDecimal grossAmount = refundItem.getOrderItem().getFinishedFee() != null
                ? refundItem.getOrderItem().getFinishedFee()
                : refundItem.getAmount();

        return grossAmount
                .multiply(BigDecimal.valueOf(sharePercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
