package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreationOrderItemRequest;
import com.hoangphihiep.dto.request.CreationOrderRequest;
import com.hoangphihiep.dto.response.OrderItemResponse;
import com.hoangphihiep.dto.response.OrderResponse;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.OrderItem;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.OrderItemMapper;
import com.hoangphihiep.mapper.OrderMapper;
import com.hoangphihiep.repository.OrderItemRepository;
import com.hoangphihiep.repository.OrderRepository;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.OrderStatus;
import com.hoangphihiep.utils.PaymentStatus;
import com.hoangphihiep.utils.PayoutStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    //
    @Transactional
    public void createOrder(CreationOrderRequest request){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Order order = Order.builder()
                .orderId(request.getOrderId())
                .paymentCurrency(request.getCurrency())
                .orderDate(request.getCreateTime())
                .orderStatus(OrderStatus.PENDING)
                .idUser(userId)
                .build();

        for (CreationOrderItemRequest itemRequest : request.getOrderItems()){
            System.out.println ("các item: " + itemRequest);
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

    /**
     * Cập nhật trạng thái Order và OrderItem khi thanh toán thành công
     * Đồng thời tính toán và tạo PayoutOrderItem cho revenue share
     */
    @Transactional
    public Order updateSuccessOrder(String orderId){
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
                .map(Order::getId)
                .toList();
        List<OrderItem> orderItems = new ArrayList<>();
        orderIds.forEach(orderId -> {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            orderItems.addAll(items);
        });

        return orderItems.stream()
                .anyMatch(item -> item.getCourse().getId().equals(publishedCourseId));
    }

    public int countNumberOfPurchasePerCourse(Integer publishedCourseId) {
        List<OrderItem> orderItems = orderItemRepository.findByCourseId(publishedCourseId);
        if (orderItems == null || orderItems.isEmpty()) {
            return 0;
        }

        return orderItems.size();
    }

}
