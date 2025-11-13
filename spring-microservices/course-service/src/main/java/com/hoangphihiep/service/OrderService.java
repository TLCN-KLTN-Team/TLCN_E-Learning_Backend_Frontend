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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemService orderItemService;
    private final OrderItemMapper orderItemMapper;
    private final OrderMapper orderMapper;

    //
    @Transactional
    public void createOrder(CreationOrderRequest request){
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Order order = Order.builder()
                .orderId(request.getOrderId())
                .orderDate(request.getCreateTime())
                .orderStatus("PENDING")
                .idUser(userId)
                .build();

        for (CreationOrderItemRequest itemRequest : request.getOrderItems()){
            OrderItem item = orderItemService.createOrderItem(itemRequest, order);
            order.getOrderItems().add(item);
        }

        order.calculateAmount();

        // 4. Lưu (cascade sẽ tự động lưu OrderItems)
        orderRepository.save(order);
    }

    public void updateSuccessOrder(Integer id){
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        order.setOrderStatus("SUCCESS");
        orderRepository.save(order);
    }

    public List<OrderResponse> getHistoryOrders() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId, null).getContent();
        return orders.stream()
                .map(order -> {
                    OrderResponse orderResponse = orderMapper.toResponse(order);
                    orderResponse.setOrderItems(orderItemMapper.toResponseList(order.getOrderItems()));
                    return orderResponse;
                })
                .toList();
    }

}
