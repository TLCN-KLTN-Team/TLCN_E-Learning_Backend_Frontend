package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.OrderResponse;
import com.hoangphihiep.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    @Mapping(source = "paymentCurrency", target = "currency")
    @Mapping(ignore = true, target = "orderItems")
    @Mapping(ignore = true, target = "paymentMethod")
    OrderResponse toResponse(Order order);
}
