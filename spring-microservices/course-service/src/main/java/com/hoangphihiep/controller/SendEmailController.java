package com.hoangphihiep.controller;

import com.hoangphihiep.service.EmailService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@Slf4j
public class SendEmailController {

    private final EmailService emailService;
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otpCode = request.get("otpCode");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Email không được để trống"));
            }

            if (otpCode == null || otpCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Mã OTP không được để trống"));
            }

            CompletableFuture<Boolean> result = emailService.sendOtpEmailAsync(email, otpCode);

            Boolean success = result.get();

            if (success) {
                log.info("OTP sent successfully to email: {}", email);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Mã OTP đã được gửi thành công đến email: " + email
                ));
            } else {
                log.error("Failed to send OTP to email: {}", email);
                return ResponseEntity.internalServerError()
                        .body(Map.of("success", false, "message", "Không thể gửi mã OTP. Vui lòng thử lại."));
            }

        } catch (Exception e) {
            log.error("Error sending OTP: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }


}
