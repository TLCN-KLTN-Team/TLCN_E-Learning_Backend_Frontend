package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.OrderPreviewRequest;
import com.hoangphihiep.dto.request.PaymentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
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
@RequestMapping("/user/payments")
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
    public ResponseEntity<?> redirectPaymentGateway(@RequestBody PaymentRequest request,
                                           HttpServletRequest httpRequest) {
        try {
            String paymentUrl="";
            if ("vnpay".equalsIgnoreCase(request.getPaymentType())) {
                paymentUrl = paymentService.createVNPayPaymentUrl(request, httpRequest);
            } else if ("paypal".equalsIgnoreCase(request.getPaymentType())) {
                paymentUrl = paymentService.processPaypalPayment(request);
            }
            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<?> paymentCallback(HttpServletRequest request) {
        // Xác thực chữ ký và xử lý kết quả thanh toán
        var response = paymentService.handleVNPayCallback(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/paypal/capture/{orderId}")
    public ResponseEntity<?> capturePaypalPayment(@PathVariable String orderId) {
        try {
            var response = paymentService.capturePaypalOrder(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error capturing PayPal payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/preview")
    public ApiResponse<?> previewPayment(@RequestBody OrderPreviewRequest request) {
        var response = paymentService.getOrderPreview(request.getCourseIds());
        return ApiResponse.success(
                response,
                "Preview order successfully"
        );
    }

}
