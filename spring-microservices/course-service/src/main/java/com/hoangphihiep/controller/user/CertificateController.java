package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CertificateResponse;
import com.hoangphihiep.entity.Certificate;
import com.hoangphihiep.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/certificates")
@RequiredArgsConstructor
@Slf4j
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/published-course/{courseId}")
    public ApiResponse<CertificateResponse> getMyCertificate(@PathVariable Integer courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<CertificateResponse>builder()
                .result(certificateService.getCertificate(userId, courseId))
                .build();
    }

    @PostMapping("/claim/{courseId}")
    public ApiResponse<Void> claimCertificate(@PathVariable Integer courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        certificateService.issueCertificateAsync(userId, courseId);
        return ApiResponse.<Void>builder()
                .message("Certificate issuance started")
                .build();
    }
    
    @GetMapping("/verify/{code}")
    public ApiResponse<CertificateResponse> verifyCertificate(@PathVariable String code) {
        return ApiResponse.<CertificateResponse>builder()
                .result(certificateService.getCertificateByCode(code))
                .build();
    }
}
