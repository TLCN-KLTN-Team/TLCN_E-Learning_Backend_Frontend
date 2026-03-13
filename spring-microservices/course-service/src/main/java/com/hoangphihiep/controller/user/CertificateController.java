package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
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
    public ApiResponse<Certificate> getMyCertificate(@PathVariable Integer courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<Certificate>builder()
                .result(certificateService.getCertificate(userId, courseId))
                .build();
    }
    
    @GetMapping("/verify/{code}")
    public ApiResponse<Certificate> verifyCertificate(@PathVariable String code) {
        // This is a public endpoint style check, but here under user for simplicity
        // In real app, might separate to Public Controller
        return ApiResponse.<Certificate>builder()
                .result(certificateService.getCertificateByCode(code))
                .build();
    }
}
