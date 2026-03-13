package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    Integer id;
    String orderId;
    String orderDate;
    BigDecimal amount;
    String currency;
    String orderStatus;
    String paymentMethod;
    List<OrderItemResponse> orderItems;
}
