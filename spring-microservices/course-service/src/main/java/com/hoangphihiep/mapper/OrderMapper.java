package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.OrderResponse;
import com.hoangphihiep.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    @Mapping(ignore = true, target = "orderItems")
    OrderResponse toResponse(Order order);
}
