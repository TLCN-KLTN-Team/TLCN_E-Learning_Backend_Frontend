package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreationOrderItemRequest;
import com.hoangphihiep.dto.request.CreationOrderRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.OrderItemMapper;
import com.hoangphihiep.mapper.OrderMapper;
import com.hoangphihiep.repository.CourseProgressRepository;
import com.hoangphihiep.repository.OrderItemRepository;
import com.hoangphihiep.repository.OrderRepository;
import com.hoangphihiep.repository.httpclient.NotificationRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.repository.httpclient.UserRepository;
import com.hoangphihiep.utils.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemService orderItemService;
    private final OrderItemMapper orderItemMapper;
    private final OrderMapper orderMapper;
    private final PayoutOrderItemService payoutOrderItemService;
    private final CartService cartService;
    private final WishlistService wishlistService;
    private final CourseProgressRepository courseProgressRepository;
    private final NotificationRepository notificationRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    // ... existing code ...

    @Transactional
    public void createOrder(CreationOrderRequest request) {
        // ... (keep existing implementation)
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Order order = Order.builder()
                .orderId(request.getOrderId())
                .paymentCurrency(request.getCurrency())
                .orderDate(request.getCreateTime())
                .orderStatus(OrderStatus.PENDING)
                .idUser(userId)
                .build();

        for (CreationOrderItemRequest itemRequest : request.getOrderItems()) {
            System.out.println("các item: " + itemRequest);
            OrderItem item = orderItemService.createOrderItem(itemRequest, order);
            order.getOrderItems().add(item);
        }

        order.calculateAmount();

        // remove from cart and wishlist
        cartService.clearCart();
        wishlistService.clearWishlist();

        // 4. Lưu (cascade sẽ tự động lưu OrderItems)
        orderRepository.save(order);
    }

    public List<Order> getOrdersByUserId() {
        String userId = JwtUtils.getCurrentUserId();
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    @Transactional
    public Order updateSuccessOrder(String orderId) {
        // ... (keep existing implementation)
        log.info("Processing successful payment for order: {}", orderId);

        // 1. Find order
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 2. Update order status
        order.setOrderStatus(OrderStatus.COMPLETED);

        // 3. Update each order item status and create payout items
        for (OrderItem orderItem : order.getOrderItems()) {
            // Update payment status to PAID
            orderItem.setPaymentStatus(PaymentStatus.PAID);
            orderItem.setPaymentTxnId(orderId); // Store transaction reference

            log.info("Updated OrderItem ID: {} to PAID status", orderItem.getId());

            // Create payout order items for revenue sharing
            try {
                payoutOrderItemService.createPayoutOrderItems(orderItem);

                // Update payout status to indicate revenue has been calculated
                orderItem.setPayoutStatus(PayoutStatus.NOT_SETTLED);

                log.info("Successfully created payout items for OrderItem ID: {}", orderItem.getId());
            } catch (Exception e) {
                log.error("Error creating payout items for OrderItem ID: {}", orderItem.getId(), e);
                // Continue processing other items even if one fails
            }
        }

        // 4. Save all changes
        Order savedOrder = orderRepository.save(order);

        log.info("Successfully processed payment for order: {} with {} items",
                orderId, order.getOrderItems().size());
        return savedOrder;
    }

    public List<OrderResponse> getHistoryOrders() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return orders.stream()
                .map(order -> {
                    OrderResponse orderResponse = orderMapper.toResponse(order);
                    orderResponse.setOrderItems(orderItemMapper.toResponseList(order.getOrderItems()));
                    return orderResponse;
                })
                .toList();
    }

    public boolean checkCoursePurchased(Integer publishedCourseId) {
        List<Order> ordersOfUser = this.getOrdersByUserId();
        List<Integer> orderIds = ordersOfUser.stream()
                .filter(order -> order.getOrderStatus().equals(OrderStatus.COMPLETED))
                .map(Order::getId)
                .toList();
        List<OrderItem> orderItems = new ArrayList<>();
        orderIds.forEach(orderId -> {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            orderItems.addAll(items);
        });

        // Updated check: verify PaymentStatus is PAID (not REFUNDED)
        return orderItems.stream()
                .anyMatch(item -> item.getCourse().getId().equals(publishedCourseId)
                        && item.getPaymentStatus() == PaymentStatus.PAID);
    }

    public int countNumberOfPurchasePerCourse(Integer publishedCourseId) {
        List<OrderItem> orderItems = orderItemRepository.findByCourseId(publishedCourseId);
        if (orderItems == null || orderItems.isEmpty()) {
            return 0;
        }
        // Only count PAID items (exclude REFUNDED)
        return (int) orderItems.stream()
                .filter(item -> item.getPaymentStatus() == PaymentStatus.PAID)
                .count();
    }

    public PaginatedResponse<OrderItemResponse> getTeacherOrders(int page, int size, String search) {
        String userId = JwtUtils.getCurrentUserId();
        
        // Fetch Teacher ID from User ID
        ApiResponse<TeacherResponse> response = teacherRepository.getTeacherByUserId(userId);
        if (response == null || response.getResult() == null) {
             throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }
        String teacherId = response.getResult().getTeacherId();

        List<OrderItem> orderItems = orderItemRepository.findAllByCourse_Course_IdTeacher(teacherId);
        List<OrderItemResponse> responses = orderItemMapper.toResponseList(new LinkedHashSet<>(orderItems));
        
        // Enrich with buyer (User) information
        for (int i = 0; i < responses.size() && i < orderItems.size(); i++) {
            OrderItemResponse itemResponse = responses.get(i);
            OrderItem orderItem = new ArrayList<>(orderItems).get(i);
            
            try {
                String buyerUserId = orderItem.getOrder().getIdUser();
                ApiResponse<UserResponse> userResp = userRepository.getUserById(buyerUserId);
                
                if (userResp != null && userResp.getResult() != null) {
                    UserResponse user = userResp.getResult();
                    String fullName = (user.getFirstName() + " " + user.getLastName()).trim();
                    itemResponse.setBuyerName(fullName.isEmpty() ? user.getUsername() : fullName);
                    itemResponse.setBuyerEmail(user.getEmail());
                    itemResponse.setBuyerId(user.getId());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch user info for userId {}: {}", orderItem.getOrder().getIdUser(), e.getMessage());
                // Continue processing other items even if one fails
                itemResponse.setBuyerName("N/A");
                itemResponse.setBuyerEmail("N/A");
            }
        }

        // Filter by search term if provided
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            responses = responses.stream()
                    .filter(item -> item.getCourseName().toLowerCase().contains(searchLower) ||
                            (item.getBuyerName() != null && item.getBuyerName().toLowerCase().contains(searchLower)) ||
                            (item.getBuyerEmail() != null && item.getBuyerEmail().toLowerCase().contains(searchLower)))
                    .toList();
        }

        // Apply pagination
        int totalElements = responses.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);

        List<OrderItemResponse> pageContent = responses.subList(startIndex, endIndex);

        return PaginatedResponse.<OrderItemResponse>builder()
                .content(pageContent)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .build();
    }

    @Transactional
    public void refundCourse(Integer orderItemId) {
        try {
            log.info("Starting ESCROW refund process for orderItemId: {}", orderItemId);
            
            // 1. Find OrderItem
            OrderItem orderItem = orderItemRepository.findById(orderItemId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
            log.info("Found order item: {}", orderItemId);

            String userId = JwtUtils.getCurrentUserId();
            if (!orderItem.getOrder().getIdUser().equals(userId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            log.info("User authorization passed: {}", userId);

            if (orderItem.getPaymentStatus() == PaymentStatus.REFUNDED) {
                throw new AppException(ErrorCode.REFUND_ALREADY_PROCESSED);
            }
            log.info("Payment status check passed");

            // 2. Validate 7-day window
            Date orderDate = orderItem.getOrder().getOrderDate();
            if (orderDate != null) {
                long daysBetween = java.util.concurrent.TimeUnit.MILLISECONDS.toDays(
                        System.currentTimeMillis() - orderDate.getTime()
                );
                if (daysBetween > 7) {
                    throw new AppException(ErrorCode.REFUND_WINDOW_EXPIRED);
                }
            }
            log.info("7-day window check passed");

            // 3. Validate Progress < 30%
            log.info("Getting published course...");
            PublishedCourse publishedCourse = orderItem.getCourse();
            log.info("Published course retrieved: {}", publishedCourse != null ? publishedCourse.getId() : "null");
            
            log.info("Getting course from published course...");
            Course course = publishedCourse != null ? publishedCourse.getCourse() : null;
            log.info("Course retrieved: {}", course != null ? course.getId() : "null");
            
            Integer courseId = course != null ? course.getId() : null;
            if (courseId == null) {
                throw new AppException(ErrorCode.COURSE_NOT_FOUND);
            }
            log.info("Course ID: {}", courseId);
            
            CourseProgress progress = courseProgressRepository
                    .findByUserIdAndCourseId(userId, courseId)
                    .orElse(null);

            if (progress != null && progress.getProgressPercentage() > 30.0) {
                throw new AppException(ErrorCode.REFUND_PROGRESS_TOO_HIGH);
            }
            log.info("Progress check passed");

            // 4. ⭐ ESCROW LOGIC - Tìm escrow item
            log.info("Looking for HELD escrow item...");
            PayoutOrderItem escrowItem = payoutOrderItemService.getPayoutItemsByOrderItem(orderItemId)
                    .stream()
                    .filter(item -> item.getStatus() == PayoutOrderItemStatus.HELD)
                    .findFirst()
                    .orElse(null);
            
            if (escrowItem == null) {
                log.warn("No HELD escrow found, checking if already released...");
                // Nếu đã release (sau 7 ngày) → không thể refund
                boolean hasReleased = payoutOrderItemService.getPayoutItemsByOrderItem(orderItemId)
                        .stream()
                        .anyMatch(item -> item.getStatus() == com.hoangphihiep.utils.PayoutOrderItemStatus.RELEASED);
                
                if (hasReleased) {
                    throw new AppException(ErrorCode.REFUND_WINDOW_EXPIRED);
                } else {
                    throw new AppException(ErrorCode.ESCROW_NOT_FOUND);
                }
            }
            
            // 5. Kiểm tra canRefund
            if (!escrowItem.getCanRefund()) {
                throw new AppException(ErrorCode.REFUND_NOT_ALLOWED);
            }
            
            // 6. ✅ REFUND TỪ ESCROW - SIÊU ĐƠN GIẢN!
            log.info("Updating payment status to PENDING_REFUND...");
            orderItem.setPaymentStatus(PaymentStatus.PENDING_REFUND);
            orderItemRepository.save(orderItem);
            log.info("Order item saved with PENDING_REFUND status");

            // 7. Notifications
            log.info("Sending refund request notifications...");
            sendRefundRequestNotifications(orderItem, userId);
            log.info("Refund request submitted successfully");
        } catch (AppException e) {
            log.error("AppException during refund: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during refund process", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void approveRefund(Integer orderItemId) {
        try {
            log.info("Starting ESCROW refund approval for orderItemId: {}", orderItemId);
            
            // 1. Find OrderItem
            OrderItem orderItem = orderItemRepository.findById(orderItemId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
            
            if (orderItem.getPaymentStatus() != PaymentStatus.PENDING_REFUND) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            log.info("Order item validated for approval");

            // 2. ⭐ ESCROW LOGIC - Tìm escrow item
            log.info("Looking for HELD escrow item...");
            PayoutOrderItem escrowItem = payoutOrderItemService.getPayoutItemsByOrderItem(orderItemId)
                    .stream()
                    .filter(item -> item.getStatus() == PayoutOrderItemStatus.HELD)
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));
            
            // 3. ✅ REFUND TỪ ESCROW - 2 DÒNG CODE!
            escrowItem.setStatus(PayoutOrderItemStatus.REFUNDED);
            escrowItem.setCanRefund(false);
            payoutOrderItemService.getPayoutOrderItemRepository().save(escrowItem);
            log.info("Escrow item marked as REFUNDED");

            // 4. Update OrderItem status
            orderItem.setPaymentStatus(PaymentStatus.REFUNDED);
            log.info("Payment status updated to REFUNDED");

            // 5. Check if all items are refunded
            log.info("Checking if all order items are refunded...");
            Order mainOrder = orderItem.getOrder();
            boolean allRefunded = mainOrder.getOrderItems().stream()
                    .allMatch(item -> item.getPaymentStatus() == PaymentStatus.REFUNDED);
            if (allRefunded) {
                mainOrder.setOrderStatus(OrderStatus.CANCELLED);
            }
            log.info("Order status check completed");

            log.info("Saving order item and order...");
            orderItemRepository.save(orderItem);
            orderRepository.save(mainOrder);
            log.info("Order item and order saved");

            // 6. Notifications
            log.info("Sending refund approval notifications...");
            String buyerId = orderItem.getOrder().getIdUser();
            sendRefundApprovedNotifications(orderItem, buyerId);
            log.info("Refund approval completed successfully");
        } catch (AppException e) {
            log.error("AppException during refund approval: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during refund approval", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void sendRefundRequestNotifications(OrderItem item, String userId) {
        try {
            // To User
            notificationRepository.sendNotification(com.hoangphihiep.dto.request.NotificationMessage.builder()
                    .userId(userId)
                    .type("REFUND_REQUESTED")
                    .message("Yêu cầu hoàn tiền cho khóa học " + item.getCourse().getCourseName() + " đã được gửi. Vui lòng chờ admin xử lý.")
                    .build());

            // To SuperAdmin(s)
            try {
                var superAdmins = userRepository.getUsersByRole("SUPER_ADMIN").getResult();
                if (superAdmins != null) {
                    for (var admin : superAdmins) {
                        notificationRepository.sendNotification(com.hoangphihiep.dto.request.NotificationMessage.builder()
                                .userId(admin.getId())
                                .type("REFUND_REQUEST")
                                .message("Yêu cầu hoàn tiền mới từ người dùng: Khóa học \"" + item.getCourse().getCourseName() + "\" (OrderItem #" + item.getId() + ")")
                                .link("/admin/refund-requests")
                                .build());
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not fetch SUPER_ADMIN list for refund notification: {}", ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to send refund request notifications", e);
        }
    }

    private void sendRefundApprovedNotifications(OrderItem item, String userId) {
        try {
            // To User
            notificationRepository.sendNotification(com.hoangphihiep.dto.request.NotificationMessage.builder()
                    .userId(userId)
                    .type("REFUND_ACCEPTED")
                    .message("Yêu cầu hoàn tiền cho khóa học " + item.getCourse().getCourseName() + " đã được chấp nhận.")
                    .build());

            // To SuperAdmin(s)
            try {
                var superAdmins = userRepository.getUsersByRole("SUPER_ADMIN").getResult();
                if (superAdmins != null) {
                    for (var admin : superAdmins) {
                        notificationRepository.sendNotification(com.hoangphihiep.dto.request.NotificationMessage.builder()
                                .userId(admin.getId())
                                .type("REFUND_PROCESSED")
                                .message("Hoàn tiền đã xử lý: Khóa học \"" + item.getCourse().getCourseName() + "\" (OrderItem #" + item.getId() + ")")
                                .link("/admin/refund-requests")
                                .build());
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not fetch SUPER_ADMIN list for refund approved notification: {}", ex.getMessage());
            }

            // To Teacher
            String teacherId = item.getCourse().getCourse().getIdTeacher();
            notificationRepository.sendNotification(com.hoangphihiep.dto.request.NotificationMessage.builder()
                    .userId(teacherId)
                    .type("REVENUE_ADJUSTMENT")
                    .message("Khóa học " + item.getCourse().getCourseName() + " đã bị hoàn tiền. Doanh thu đã được điều chỉnh.")
                    .build());

        } catch (Exception e) {
            log.error("Error sending refund approved notifications", e);
        }
    }

    public List<OrderItemResponse> getPendingRefundItems() {
        List<OrderItem> pendingRefundItems = orderItemRepository.findByPaymentStatus(PaymentStatus.PENDING_REFUND);
        return orderItemMapper.toResponseList(new LinkedHashSet<>(pendingRefundItems));
    }
}
