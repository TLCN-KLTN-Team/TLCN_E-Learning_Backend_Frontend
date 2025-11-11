package com.hoangphihiep.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequest {
//    Integer publishedCourseId;
//    String nationality;
//    BigDecimal originalPrice;
//    BigDecimal discountedPrice;
    BigDecimal amount;
    Integer orderId;
//    String policy;
//    String type;
}
