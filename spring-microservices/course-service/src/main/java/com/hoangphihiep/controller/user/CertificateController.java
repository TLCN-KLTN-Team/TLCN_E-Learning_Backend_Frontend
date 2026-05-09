package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CertificateResponse;
import com.hoangphihiep.entity.Certificate;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.service.CertificateService;
import com.hoangphihiep.dto.request.ClaimRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user/certificates")
@RequiredArgsConstructor
@Slf4j
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/claim/{courseId}/challenge")
    public ApiResponse<com.hoangphihiep.dto.response.ClaimChallengeResponse> getClaimChallenge(@PathVariable Integer courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        com.hoangphihiep.dto.response.ClaimChallengeResponse resp = certificateService.generateClaimChallenge(userId, courseId);
        return ApiResponse.<com.hoangphihiep.dto.response.ClaimChallengeResponse>builder().result(resp).build();
    }

    @GetMapping("/published-course/{courseId}")
    public ApiResponse<CertificateResponse> getMyCertificate(@PathVariable Integer courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<CertificateResponse>builder()
                .result(certificateService.getCertificate(userId, courseId))
                .build();
    }

    @PostMapping("/claim/{courseId}")
    public ApiResponse<Void> claimCertificate(
            @PathVariable Integer courseId,
            @RequestBody ClaimRequest claimRequest
    ) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            if (claimRequest == null || claimRequest.getWalletAddress() == null || claimRequest.getSignature() == null) {
                return ApiResponse.<Void>builder().message("walletAddress and signature are required for claiming certificate").build();
            }

            certificateService.claimCertificateWithWallet(userId, courseId, claimRequest.getWalletAddress(), claimRequest.getSignature(), claimRequest.getMessage());
        } catch (Exception e) {
            log.error("Error processing claim request for user {} course {}", userId, courseId, e);
            return ApiResponse.<Void>builder().message("Failed to process claim request: " + e.getMessage()).build();
        }

        return ApiResponse.<Void>builder()
                .message("Claim processed (issuance will proceed if signature is valid)")
                .build();
    }
    
    @GetMapping("/verify/{code}")
    public ApiResponse<CertificateResponse> verifyCertificate(@PathVariable String code) {
        return ApiResponse.<CertificateResponse>builder()
                .result(certificateService.getCertificateByCode(code))
                .build();
    }

    /**
     * Public endpoint to verify certificate by hash against blockchain
     * Returns blockchain verification results for the certificate
     */
    @GetMapping(value = "/verify-hash/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> verifyCertificateByHash(@PathVariable String hash) {
        try {
            CertificateResponse certificate = certificateService.getCertificateByHash(hash);
            
            if (certificate == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.builder()
                                .error(ErrorCode.valueOf("Certificate with this hash not found in database"))
                                .build());
            }

            // Verify against blockchain
            if (certificate.getStatus() != Certificate.CertificateStatus.ISSUED) {
                return ResponseEntity.ok(ApiResponse.builder()
                        .message("Certificate is not in ISSUED status")
                        .result(Map.of(
                            "verified", false,
                            "reason", "Certificate status is " + certificate.getStatus(),
                            "certificate", certificate
                        ))
                        .build());
            }

            // Verify the hash on blockchain
            boolean hashValid = certificateService.verifyHashOnBlockchain(hash, certificate.getCertificateCode());
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .message(hashValid ? "Certificate verified successfully" : "Certificate hash verification failed")
                    .result(Map.of(
                        "verified", hashValid,
                        "certificate", certificate,
                        "blockchainVerified", hashValid
                    ))
                    .build());
        } catch (Exception e) {
            log.error("Error verifying certificate by hash: {}", hash, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.builder()
                            .error(ErrorCode.valueOf("Verification failed: " + e.getMessage()))
                            .build());
        }
    }

    /**
     * Public endpoint to download/view certificate PDF (placeholder implementation)
     * In production, this would generate or retrieve actual PDF file
     */
    @GetMapping(value = "/{code}/pdf", produces = "application/pdf")
    public ResponseEntity<?> getCertificatePdf(@PathVariable String code) {
        try {
            byte[] pdfContent = certificateService.generateCertificatePdf(code);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificate_" + code + ".pdf\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(pdfContent);
        } catch (Exception e) {
            log.error("Failed to generate PDF for certificate: {}", code, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.builder()
                            .error(ErrorCode.valueOf("Certificate not found or PDF generation failed"))
                            .build());
        }
    }
}
