package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.PaymentRequest;
import com.hoangphihiep.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;

    /**
     * Tạo payment URL để redirect user đến VNPay
     * POST /api/v1/course-management/payments/create
     * Body: {
     *   "orderId": 1,
     *   "language": "vn",
     *   "bankCode": "NCB" // optional
     * }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request,
                                           HttpServletRequest httpRequest) {
        try {
            String paymentUrl = paymentService.createVNPayPaymentUrl(request, httpRequest);
            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/return")
    public ResponseEntity<?> paymentCallback(HttpServletRequest request) {
        // Xác thực chữ ký và xử lý kết quả thanh toán
        var response = paymentService.handleVNPayCallback(request);
        return ResponseEntity.ok(response);
    }
}
