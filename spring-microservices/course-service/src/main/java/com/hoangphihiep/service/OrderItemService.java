package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreationOrderItemRequest;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.OrderItem;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.OrderItemRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderItemService {
    private final OrderItemRepository orderItemRepository;
    private final PublishedCourseRepository publishedCourseRepository;

    public OrderItem createOrderItem(CreationOrderItemRequest request,
                                     Order order){
        PublishedCourse publishedCourse = publishedCourseRepository.findById(request.getPublishedCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));
        return OrderItem.builder()
                .course(publishedCourse)
                .finishedFee(request.getFinishedFee())
                .order(order)
                .build();
    }

    public List<OrderItem> getOrderItemsByListOrderIds(List<Integer> orderIds) {
        List<OrderItem> orderItems = new ArrayList<>();
        for (Integer orderId : orderIds) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            orderItems.addAll(items);
        }
        return orderItems;
    }

    public Set<Integer> getPurchasedCourseIdsByListOrderIds(List<Integer> orderIds) {
        Set<Integer> courseIds = new java.util.HashSet<>();
        for (Integer orderId : orderIds) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                courseIds.add(item.getCourse().getCourse().getId());
            }
        }
        return courseIds;
    }
}
