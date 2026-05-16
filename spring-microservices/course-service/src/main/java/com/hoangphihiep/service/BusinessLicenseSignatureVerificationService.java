package com.hoangphihiep.service;

import com.hoangphihiep.config.SignatureVerificationConfig;
import com.hoangphihiep.dto.response.SignatureVerificationResponse;
import com.hoangphihiep.utils.RevocationTimeoutPolicy;
import com.hoangphihiep.utils.SignatureVerificationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.SignerId;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.SignerInformationStore;
import org.bouncycastle.util.Store;
import org.bouncycastle.util.encoders.Hex;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class BusinessLicenseSignatureVerificationService {

    private final SignatureVerificationConfig signatureVerificationConfig;
    private final CertificateRevocationCheckService certificateRevocationCheckService;

    public SignatureVerificationResponse verify(MultipartFile signedPdf) {
        if (signedPdf == null || signedPdf.isEmpty()) {
            return SignatureVerificationResponse.invalid(
                    SignatureVerificationStatus.INVALID_PARSE_ERROR,
                    "LICENSE_FILE_MISSING",
                    "Thiếu file giấy phép đã ký số"
            );
        }

        try {
            String sourceName = signedPdf.getOriginalFilename() != null
                    ? signedPdf.getOriginalFilename()
                    : "signed-license.pdf";
            return verify(signedPdf.getBytes(), sourceName);
        } catch (Exception ex) {
            log.error("Cannot read signed PDF bytes: {}", ex.getMessage(), ex);
                return SignatureVerificationResponse.invalid(
                    SignatureVerificationStatus.INVALID_PARSE_ERROR,
                    "SIGNATURE_PARSE_EXCEPTION",
                    "Không thể đọc nội dung chữ ký số trong PDF"
            );
        }
    }

    public SignatureVerificationResponse verify(byte[] signedPdfBytes, String sourceName) {
        if (signedPdfBytes == null || signedPdfBytes.length == 0) {
                return SignatureVerificationResponse.invalid(
                    SignatureVerificationStatus.INVALID_PARSE_ERROR,
                    "LICENSE_FILE_MISSING",
                    "Thiếu dữ liệu giấy phép đã ký số"
            );
        }

        try {
            if (signedPdfBytes.length < 8) {
                return SignatureVerificationResponse.invalid(
                        SignatureVerificationStatus.INVALID_PARSE_ERROR,
                        "PDF_INVALID",
                        "File PDF không hợp lệ hoặc bị hỏng"
                );
            }

            String content = new String(signedPdfBytes, StandardCharsets.ISO_8859_1);
            if (!content.startsWith("%PDF")) {
                return SignatureVerificationResponse.invalid(
                        SignatureVerificationStatus.INVALID_PARSE_ERROR,
                        "PDF_INVALID_HEADER",
                        "File không đúng định dạng PDF: " + sourceName
                );
            }

            boolean hasSignatureMarkers = content.contains("/ByteRange") && content.contains("/Contents");
            if (!hasSignatureMarkers) {
                return SignatureVerificationResponse.invalid(
                        SignatureVerificationStatus.INVALID_PARSE_ERROR,
                        "SIGNATURE_NOT_FOUND",
                        "Không tìm thấy chữ ký số trong PDF"
                );
            }

            boolean hasTimestamp = content.contains("/DocTimeStamp")
                    || content.contains("ETSI.RFC3161")
                    || content.contains("/Type/DocTimeStamp");

                X509CertificateHolder signerCertificate = extractSignerCertificate(content);
                if (signerCertificate == null) {
                    return SignatureVerificationResponse.invalid(
                            SignatureVerificationStatus.INVALID_PARSE_ERROR,
                            "SIGNER_CERT_NOT_FOUND",
                            "Không tìm thấy chứng thư người ký trong tài liệu"
                    );
                }

                if (!isTrustedIssuer(signerCertificate)) {
                    return SignatureVerificationResponse.invalid(
                            SignatureVerificationStatus.INVALID_UNTRUSTED_CA,
                            "UNTRUSTED_CA",
                            "Chứng thư ký số không thuộc danh sách CA tin cậy của hệ thống"
                    ).toBuilder()
                            .certificateExpiryDate(signerCertificate.getNotAfter())
                            .build();
                }

                Date certificateExpiryDate = signerCertificate.getNotAfter();
                if (certificateExpiryDate != null && certificateExpiryDate.before(new Date())) {
                    return SignatureVerificationResponse.invalid(
                            SignatureVerificationStatus.INVALID_EXPIRED,
                            "CERTIFICATE_EXPIRED",
                            "Chứng thư số đã hết hạn"
                    ).toBuilder()
                            .certificateExpiryDate(certificateExpiryDate)
                            .build();
                }

                CertificateRevocationCheckService.RevocationCheckResult revocationResult =
                    certificateRevocationCheckService.check(signerCertificate, signatureVerificationConfig.getRevocationTimeoutMs());
                    String revocationStatusDetail = buildRevocationStatusDetail(revocationResult);

                if ("REVOKED".equalsIgnoreCase(revocationResult.getStatus())) {
                    return SignatureVerificationResponse.invalid(
                            SignatureVerificationStatus.INVALID_REVOKED,
                            "CERTIFICATE_REVOKED",
                            "Chứng thư số đã bị thu hồi"
                    ).toBuilder()
                            .revocationStatus(revocationStatusDetail)
                            .certificateExpiryDate(certificateExpiryDate)
                            .build();
                }

                if (revocationResult.isTimedOut()
                    && signatureVerificationConfig.getRevocationTimeoutPolicy() == RevocationTimeoutPolicy.FAIL_CLOSED) {
                    return SignatureVerificationResponse.invalid(
                            SignatureVerificationStatus.INVALID,
                            "REVOCATION_CHECK_TIMEOUT",
                            "Không thể kiểm tra trạng thái thu hồi chứng thư trong thời gian cho phép"
                    ).toBuilder()
                            .revocationStatus(revocationStatusDetail)
                            .certificateExpiryDate(certificateExpiryDate)
                            .build();
                }

            String warning = null;

            return SignatureVerificationResponse.builder()
                    .status(SignatureVerificationStatus.VERIFIED_UNMODIFIED)
                    .errorCode(null)
                    .errorReason(null)
                    .warning(warning)
                    .hasTimestamp(hasTimestamp)
                    .revocationStatus(revocationStatusDetail)
                    .verifiedAt(new Date())
                    .certificateExpiryDate(certificateExpiryDate)
                    .build();
        } catch (Exception ex) {
            log.error("Cannot parse signed PDF for verification: {}", ex.getMessage(), ex);
            return SignatureVerificationResponse.invalid(
                    SignatureVerificationStatus.INVALID_PARSE_ERROR,
                    "SIGNATURE_PARSE_EXCEPTION",
                    "Không thể đọc nội dung chữ ký số trong PDF"
            );
        }
    }

    private X509CertificateHolder extractSignerCertificate(String pdfContent) {
        try {
            byte[] signatureBytes = extractCmsSignatureBytes(pdfContent);
            if (signatureBytes == null || signatureBytes.length == 0) {
                return null;
            }

            CMSSignedData cmsSignedData = new CMSSignedData(signatureBytes);
            Store<X509CertificateHolder> certStore = cmsSignedData.getCertificates();
            SignerInformationStore signerInfos = cmsSignedData.getSignerInfos();
            if (signerInfos == null || signerInfos.getSigners().isEmpty()) {
                return null;
            }

            SignerInformation signer = signerInfos.getSigners().iterator().next();
            SignerId signerId = signer.getSID();

            @SuppressWarnings("unchecked")
            var matches = certStore.getMatches(signerId);
            if (matches == null || matches.isEmpty()) {
                return null;
            }

            return (X509CertificateHolder) matches.iterator().next();
        } catch (CMSException ex) {
            log.debug("Cannot parse CMS signature block from PDF: {}", ex.getMessage());
            return null;
        } catch (Exception ex) {
            log.debug("Cannot extract signer certificate from PDF signature: {}", ex.getMessage());
            return null;
        }
    }

    private boolean isTrustedIssuer(X509CertificateHolder certHolder) {
        if (certHolder == null) {
            return false;
        }

        String issuer = certHolder.getIssuer() != null
                ? certHolder.getIssuer().toString().toUpperCase(Locale.ROOT)
                : "";

        if (issuer.isBlank()) {
            return false;
        }

        for (String keyword : signatureVerificationConfig.getTrustedIssuerKeywords()) {
            if (keyword != null && !keyword.isBlank()
                    && issuer.contains(keyword.trim().toUpperCase(Locale.ROOT))) {
                return true;
            }
        }

        return false;
    }

    private String buildRevocationStatusDetail(CertificateRevocationCheckService.RevocationCheckResult result) {
        if (result == null) {
            return "MANUAL_REVIEW_REQUIRED";
        }

        if (result.getDetail() == null || result.getDetail().isBlank()) {
            return result.getStatus();
        }

        return result.getStatus() + " (" + result.getDetail() + ")";
    }

    private byte[] extractCmsSignatureBytes(String pdfContent) {
        Pattern pattern = Pattern.compile("/Contents\\s*<([0-9A-Fa-f\\s]+)>");
        Matcher matcher = pattern.matcher(pdfContent);
        if (!matcher.find()) {
            return null;
        }

        String hexSignature = matcher.group(1);
        if (hexSignature == null || hexSignature.isBlank()) {
            return null;
        }

        String cleanedHex = hexSignature.replaceAll("\\s+", "");
        if (cleanedHex.length() % 2 != 0) {
            cleanedHex = cleanedHex.substring(0, cleanedHex.length() - 1);
        }

        if (cleanedHex.isEmpty()) {
            return null;
        }

        return Hex.decode(cleanedHex);
    }

}
