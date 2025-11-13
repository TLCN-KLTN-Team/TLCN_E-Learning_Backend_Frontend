package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreationOrderItemRequest;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.OrderItem;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.OrderItemRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}
