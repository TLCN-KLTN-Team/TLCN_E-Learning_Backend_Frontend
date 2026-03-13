package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.OrderItemResponse;
import com.hoangphihiep.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    @Mapping(source = "order.orderId", target = "orderId")
    @Mapping(source = "course.courseName", target = "courseName")
    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "finishedFee", target = "price")
    @Mapping(source = "course.courseImage", target = "thumbnailUrl")
    @Mapping(source = "order.orderDate", target = "orderDate")
    @Mapping(ignore = true, target = "buyerName")
    @Mapping(ignore = true, target = "buyerEmail")
    @Mapping(ignore = true, target = "buyerId")
    OrderItemResponse toResponse(OrderItem orderItem);
    
    List<OrderItemResponse> toResponseList(Set<OrderItem> orderItems);
}
