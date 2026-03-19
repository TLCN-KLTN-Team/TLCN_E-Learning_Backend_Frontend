package com.hoangphihiep.controller.anonymous;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.PublicCertificateVerificationResponse;
import com.hoangphihiep.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/anonymous/certificates")
public class AnonymousCertificateController {

    private final CertificateService certificateService;

    @GetMapping("/verify/{code}")
    public ApiResponse<PublicCertificateVerificationResponse> verifyCertificatePublic(@PathVariable String code) {
        return ApiResponse.<PublicCertificateVerificationResponse>builder()
                .result(certificateService.verifyCertificatePublic(code))
                .build();
    }
}
