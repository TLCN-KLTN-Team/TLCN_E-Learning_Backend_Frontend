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
    String amount;                // Số tiền
    String currency;              // Loại tiền tệ
    String message;             // Thông báo kết quả
    String transactionId;       // VNPay transaction ID
    String txnRef;              // Order reference
    String bankCode;            // Mã ngân hàng
    String orderInfo;           // Thông tin đơn hàng
    LocalDateTime paymentTime;  // Thời gian thanh toán
}
