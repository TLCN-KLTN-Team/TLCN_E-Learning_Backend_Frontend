package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    Integer id;
    String orderId;
    String courseName;
    Integer courseId;
    BigDecimal price;
    String paymentStatus;
    String thumbnailUrl;
    String payoutStatus;
    Date orderDate;
    String buyerName;
    String buyerEmail;
    String buyerId;
}
