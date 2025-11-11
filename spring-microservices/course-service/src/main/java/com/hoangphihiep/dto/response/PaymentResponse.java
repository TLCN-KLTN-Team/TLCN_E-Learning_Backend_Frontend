package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentResponse {
    String paymentUrl;      // URL để redirect user đến VNPay
    String orderId;         // Order ID
    String txnRef;          // Transaction reference (VNPay order ID)
    Long amount;            // Số tiền (đã nhân 100)
}
