package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.OrderItemResponse;
import com.hoangphihiep.entity.OrderItem;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    List<OrderItemResponse> toResponseList(Set<OrderItem> orderItems);
}
