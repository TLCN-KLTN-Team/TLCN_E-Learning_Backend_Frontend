package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VNPayReturnResponse {
    boolean success;        // Mã phản hồi từ VNPay
    String message;             // Thông báo kết quả
    String transactionId;       // VNPay transaction ID
    String txnRef;              // Order reference
    Long amount;                // Số tiền
    String bankCode;            // Mã ngân hàng
    String orderInfo;           // Thông tin đơn hàng
    LocalDateTime paymentTime;  // Thời gian thanh toán
}
