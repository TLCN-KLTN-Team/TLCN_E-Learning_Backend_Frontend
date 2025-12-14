package com.hoangphihiep.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.sql.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreationOrderRequest {
    String orderId;
    Date createTime;
    String currency;
    Set<CreationOrderItemRequest> orderItems;
}
