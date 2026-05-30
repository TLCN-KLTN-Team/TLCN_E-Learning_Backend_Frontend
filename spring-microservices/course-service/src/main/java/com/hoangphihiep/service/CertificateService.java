package com.hoangphihiep.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import com.hoangphihiep.service.blockchain.Web3jService;
import com.hoangphihiep.utils.CertificateStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;
import org.xhtmlrenderer.pdf.ITextRenderer;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final CertificateRepository certificateRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final Web3jService web3jService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserInfoApi userInfoApi;

    @Value("${pinata.jwt:}")
    private String pinataJwt;

    @Value("${pinata.gateway-url:https://gateway.pinata.cloud/ipfs/}")
    private String pinataGatewayUrl;

    @Value("${pinata.api-url:https://api.pinata.cloud}")
    private String pinataApiUrl;

    public ClaimChallengeResponse generateClaimChallenge(String userId, Integer publishedCourseId) {
        // create nonce and message bound to userId and course
        String nonce = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 16);
        long expiresAt = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes
        String message = String.format("claim:%s:%d:%s:%d", userId, publishedCourseId, nonce, expiresAt);

        com.hoangphihiep.dto.response.ClaimChallengeResponse resp = new com.hoangphihiep.dto.response.ClaimChallengeResponse();
        resp.setMessage(message);
        resp.setNonce(nonce);
        resp.setExpiresAt(new Date(expiresAt));
        return resp;
    }

    public void claimCertificateWithWallet(String userId, Integer publishedCourseId, String walletAddress, String signature, String message) {
        // Verify signature: expect an Ethereum personal_sign style signature
        try {
            if (walletAddress == null || signature == null) {
                throw new RuntimeException("Wallet address and signature are required");
            }

            log.info("=== CLAIM WALLET VERIFICATION START ===");
            log.info("Claim userId={}, publishedCourseId={}", userId, publishedCourseId);
            log.info("Provided walletAddress={}", walletAddress);
            log.info("Challenge message={}", message);
            log.debug("Raw signature={}", signature);

            // Build prefixed message as used by personal_sign
            String sig = signature.startsWith("0x") ? signature.substring(2) : signature;
            byte[] sigBytes = Numeric.hexStringToByteArray(sig);
            if (sigBytes.length != 65) {
                throw new RuntimeException("Invalid signature length: " + sigBytes.length);
            }

            byte v = sigBytes[64];
            if (v < 27) v += 27;

            byte[] r = java.util.Arrays.copyOfRange(sigBytes, 0, 32);
            byte[] s = java.util.Arrays.copyOfRange(sigBytes, 32, 64);

            Sign.SignatureData signatureData = new Sign.SignatureData(v, r, s);

            byte[] messageBytes = message.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            BigInteger publicKey = Sign.signedPrefixedMessageToKey(messageBytes, signatureData);
            String recovered = "0x" + Keys.getAddress(publicKey);

            log.info("Recovered walletAddress={}", recovered);

            if (!recovered.equalsIgnoreCase(walletAddress)) {
                log.warn("Recovered wallet does not match provided wallet. recovered={}, provided={}", recovered, walletAddress);
                throw new RuntimeException("Signature does not match provided wallet address");
            }

            // Validate challenge nonce and expiry
            // Expect message format: claim:{userId}:{publishedCourseId}:{nonce}:{expiresAt}
            String[] parts = message.split(":");
            if (parts.length < 5 || !"claim".equals(parts[0])) {
                log.warn("Invalid challenge format. partsLength={}, firstPart={}", parts.length, parts.length > 0 ? parts[0] : "N/A");
                throw new RuntimeException("Invalid challenge message format");
            }

            String challengeUserId = parts[1];
            Integer challengeCourseId = Integer.valueOf(parts[2]);
            String nonce = parts[3];
            long expiresAt = Long.parseLong(parts[4]);

            log.info("Parsed challenge -> challengeUserId={}, challengeCourseId={}, nonce={}, expiresAt={}",
                    challengeUserId, challengeCourseId, nonce, expiresAt);

            if (!challengeUserId.equals(userId) || !challengeCourseId.equals(publishedCourseId)) {
                log.warn("Challenge mismatch. challengeUserId={}, challengeCourseId={}, requestUserId={}, requestCourseId={}",
                        challengeUserId, challengeCourseId, userId, publishedCourseId);
                throw new RuntimeException("Challenge does not match request");
            }

            if (System.currentTimeMillis() > expiresAt) {
                log.warn("Challenge expired. now={}, expiresAt={}", System.currentTimeMillis(), expiresAt);
                throw new RuntimeException("Challenge expired");
            }

            log.info("Challenge verified successfully in stateless mode. nonce={}", nonce);

            // Signature verified. Create or update Certificate record with provided wallet
            var existingCertOpt = certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId);
            Certificate certificate = null;

            if (existingCertOpt.isPresent()) {
                Certificate existing = existingCertOpt.get();
                if (existing.getStatus() == CertificateStatus.ISSUED) {
                    // nothing to do
                    return;
                }

                // reuse or overwrite pending/failed
                certificate = existing;
            }

            if (certificate == null) {
                // create pending certificate with metadata similar to issueCertificateAsync
                PublishedCourse publishedCourse = publishedCourseRepository.findByIdWithCourse(publishedCourseId)
                        .orElseThrow(() -> new RuntimeException("Published Course not found"));
                Integer courseId = publishedCourse.getCourse().getId();
                String courseName = publishedCourse.getCourse().getCourseName();

                Double finalScore = calculateStudentGrade(userId, courseId);
                String grade = determineGrade(finalScore);
                String certificateCode = UUID.randomUUID().toString();
                Date issueDate = new Date();
                String payload = certificateCode + ":" + userId + ":" + publishedCourseId + ":" + issueDate.getTime();
                String certificateHash = generateSha256Hex(payload);

                // Render and upload PDF + metadata
                CertificateResponse certificatePreview = CertificateResponse.builder()
                        .userId(maskUserId(userId))
                        .studentName(resolveStudentName(userId))
                        .courseId(courseId)
                        .courseName(courseName)
                        .certificateCode(certificateCode)
                        .issueDate(issueDate)
                        .certificateHash(certificateHash)
                        .finalScore(finalScore)
                        .grade(grade)
                        .tokenId(null)
                        .status(CertificateStatus.PENDING)
                        .build();

                byte[] pdfBytes = renderCertificatePdf(certificatePreview);
                String pdfCid = uploadPdfToPinata(certificateCode, pdfBytes);
                String pdfUrl = toIpfsUri(pdfCid);

                HashMap<String, Object> metadataPayload = new HashMap<>();
                metadataPayload.put("name", "Certificate of Completion - " + courseName);
                metadataPayload.put("description", "Certificate earned for completing " + courseName);
                metadataPayload.put("image", pdfUrl);
                metadataPayload.put("external_url", pdfUrl);
                metadataPayload.put("certificateCode", certificateCode);
                metadataPayload.put("certificateHash", certificateHash);
                metadataPayload.put("studentName", resolveStudentName(userId));
                metadataPayload.put("studentWallet", walletAddress);
                metadataPayload.put("courseName", courseName);
                metadataPayload.put("grade", grade);
                metadataPayload.put("finalScore", finalScore);
                metadataPayload.put("issueDate", issueDate);
                metadataPayload.put("status", CertificateStatus.PENDING.toString());
                metadataPayload.put("pdfCid", pdfCid);
                metadataPayload.put("pdfUrl", pdfUrl);

                String metadataCid = uploadMetadataToPinata(certificateCode, metadataPayload);
                String tokenUri = toIpfsUri(metadataCid);
                String tokenId = generateTokenId(certificateHash);

                certificate = Certificate.builder()
                        .userId(userId)
                        .publishedCourse(publishedCourse)
                        .certificateCode(certificateCode)
                        .issueDate(issueDate)
                        .status(CertificateStatus.PENDING)
                        .finalScore(finalScore)
                        .grade(grade)
                        .certificateHash(certificateHash)
                        .studentWallet(walletAddress)
                        .pdfCid(pdfCid)
                        .metadataCid(metadataCid)
                        .pdfUrl(pdfUrl)
                        .tokenUri(tokenUri)
                        .tokenId(tokenId)
                        .signature(signature)
                        .signatureMessage(message)
                        .signatureVerifiedAt(new Date())
                        .build();

                certificateRepository.save(certificate);
            } else {
                // Update existing with verified wallet
                certificate.setStudentWallet(walletAddress);
                certificate.setSignature(signature);
                certificate.setSignatureMessage(message);
                certificate.setSignatureVerifiedAt(new Date());
                certificate.setStatus(CertificateStatus.PENDING);
                certificateRepository.save(certificate);
            }

            issueCertificate(userId, publishedCourseId);

        } catch (Exception e) {
            log.error("Claim with wallet failed for user {} course {}", userId, publishedCourseId, e);
            throw new RuntimeException("Claim verification failed: " + e.getMessage());
        }
    }

    public void issueCertificate(String userId, Integer publishedCourseId) {
        String lockKey = userId + ":" + publishedCourseId;
        Object lock = new Object();

        synchronized (lock) {
            try {
                var existingCert = certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId);

                Certificate certificate = null;
                String certificateCode = null;
                String certificateHash = null;
                String studentWallet = null;
                String tokenUri = null;
                String tokenId = null;

                PublishedCourse publishedCourse = publishedCourseRepository.findByIdWithCourse(publishedCourseId)
                        .orElseThrow(() -> new RuntimeException("Published Course not found"));
                Integer courseId = publishedCourse.getCourse().getId();
                String courseName = publishedCourse.getCourse().getCourseName();

                if (existingCert.isPresent()) {
                    Certificate cert = existingCert.get();
                    if (cert.getStatus() == CertificateStatus.ISSUED) {
                        return;
                    }

                    certificate = cert;
                    certificateCode = cert.getCertificateCode();
                    certificateHash = cert.getCertificateHash();
                    studentWallet = cert.getStudentWallet();
                    tokenUri = cert.getTokenUri();
                    tokenId = cert.getTokenId();
                }

                if (certificate == null) {
                    Double finalScore = calculateStudentGrade(userId, courseId);
                    String grade = determineGrade(finalScore);
                    certificateCode = UUID.randomUUID().toString();
                    Date issueDate = new Date();
                    String payload = certificateCode + ":" + userId + ":" + publishedCourseId + ":" + issueDate.getTime();
                    certificateHash = generateSha256Hex(payload);
                    studentWallet = resolveStudentWallet(userId);

                    CertificateResponse certificatePreview = CertificateResponse.builder()
                            .userId(maskUserId(userId))
                            .studentName(resolveStudentName(userId))
                            .courseId(courseId)
                            .courseName(courseName)
                            .certificateCode(certificateCode)
                            .issueDate(issueDate)
                            .certificateHash(certificateHash)
                            .finalScore(finalScore)
                            .grade(grade)
                            .tokenId(tokenId)
                            .status(CertificateStatus.PENDING)
                            .build();

                    byte[] pdfBytes = renderCertificatePdf(certificatePreview);
                    String pdfCid = uploadPdfToPinata(certificateCode, pdfBytes);
                    String pdfUrl = toIpfsUri(pdfCid);

                    HashMap<String, Object> metadataPayload = new HashMap<>();
                    metadataPayload.put("name", "Certificate of Completion - " + courseName);
                    metadataPayload.put("description", "Certificate earned for completing " + courseName);
                    metadataPayload.put("image", pdfUrl);
                    metadataPayload.put("external_url", pdfUrl);
                    metadataPayload.put("certificateCode", certificateCode);
                    metadataPayload.put("certificateHash", certificateHash);
                    metadataPayload.put("studentName", resolveStudentName(userId));
                    metadataPayload.put("studentWallet", studentWallet);
                    metadataPayload.put("courseName", courseName);
                    metadataPayload.put("grade", grade);
                    metadataPayload.put("finalScore", finalScore);
                    metadataPayload.put("issueDate", issueDate);
                    metadataPayload.put("status", CertificateStatus.PENDING.toString());
                    metadataPayload.put("pdfCid", pdfCid);
                    metadataPayload.put("pdfUrl", pdfUrl);

                    String metadataCid = uploadMetadataToPinata(certificateCode, metadataPayload);
                    tokenUri = toIpfsUri(metadataCid);
                    tokenId = generateTokenId(certificateHash);

                    certificate = Certificate.builder()
                            .userId(userId)
                            .publishedCourse(publishedCourse)
                            .certificateCode(certificateCode)
                            .issueDate(issueDate)
                            .status(CertificateStatus.PENDING)
                            .finalScore(finalScore)
                            .grade(grade)
                            .certificateHash(certificateHash)
                            .studentWallet(studentWallet)
                            .pdfCid(pdfCid)
                            .metadataCid(metadataCid)
                            .pdfUrl(pdfUrl)
                            .tokenUri(tokenUri)
                            .tokenId(tokenId)
                            .build();

                    certificate = certificateRepository.save(certificate);
                }

                try {
                    String txHash = issueCertificateWithRecovery(certificateCode, userId, studentWallet, publishedCourseId, certificateHash, tokenUri, tokenId);

                    certificate.setTransactionHash(txHash);
                    certificate.setContractAddress(web3jService.getContractAddress());
                    certificate.setStatus(CertificateStatus.ISSUED);
                    certificate.setBlockNumber(web3jService.getBlockNumber(txHash));
                    certificateRepository.save(certificate);

                    log.info("Certificate Issued Successfully! Tx: {}", txHash);
                } catch (Exception e) {
                    String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                    log.error("Failed to issue blockchain certificate: {}", errorMsg, e);

                    if (errorMsg.contains("INSUFFICIENT_FUNDS")) {
                        certificate.setStatus(CertificateStatus.FAILED);
                    } else {
                        certificate.setStatus(CertificateStatus.PENDING);
                    }

                    certificateRepository.save(certificate);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to issue certificate: " + e.getMessage(), e);
            }
        }
    }

    private String issueCertificateWithRecovery(String certificateCode, String userId, String studentWallet, Integer publishedCourseId, String certificateHash, String tokenUri, String tokenId) throws Exception {
        try {
            return web3jService.issueCertificateTransaction(studentWallet, certificateCode, userId, publishedCourseId, certificateHash, tokenUri, tokenId);
        } catch (Exception firstEx) {
            log.warn("Initial blockchain issuance failed for certificateCode={} user={} course={}, attempting recovery. Error: {}", certificateCode, userId, publishedCourseId, firstEx.getMessage(), firstEx);
            try {
                log.info("Attempting on-chain claim reset for user={} publishedCourseId={}", userId, publishedCourseId);
                web3jService.revokeCertificateClaim(userId, publishedCourseId);
            } catch (Exception revokeEx) {
                log.warn("On-chain claim reset failed during recovery: {}", revokeEx.getMessage(), revokeEx);
            }

            // Retry once after attempting claim reset
            try {
                return web3jService.issueCertificateTransaction(studentWallet, certificateCode, userId, publishedCourseId, certificateHash, tokenUri, tokenId);
            } catch (Exception secondEx) {
                log.error("Retry issuance also failed for certificateCode={} user={} course={}. Error: {}", certificateCode, userId, publishedCourseId, secondEx.getMessage(), secondEx);
                throw secondEx;
            }
        }
    }

    public CertificateResponse getCertificate(String userId, Integer publishedCourseId) {
        return certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId)
                .map(this::toCertificateResponse)
                .orElse(null);
    }
    
    public CertificateResponse getCertificateByCode(String code) {
         return certificateRepository.findByCertificateCode(code)
                 .map(this::toCertificateResponse)
                 .orElse(null);
    }

    public CertificateResponse getCertificateByHash(String hash) {
        return certificateRepository.findByCertificateHash(hash)
                .map(this::toCertificateResponse)
                .orElse(null);
    }

    public boolean verifyHashOnBlockchain(String certificateHash, String certificateCode) {
        try {
            // Verify the certificate hash on the blockchain
            Object verifyResult = web3jService.verifyCertificateByHash(certificateHash);
            log.info("Blockchain hash verification completed for certificate: {}", certificateCode);
            // If no exception, verification was successful
            return true;
        } catch (Exception e) {
            log.warn("Blockchain hash verification failed for certificate {}: {}", certificateCode, e.getMessage());
            return false;
        }
    }

    private CertificateResponse toCertificateResponse(Certificate certificate) {
        CertificateResponse response = CertificateResponse.fromEntity(certificate);

        if (response.getFinalScore() == null) {
            Integer courseId = certificate.getPublishedCourse().getCourse().getId();
            Double fallbackScore = calculateStudentGrade(certificate.getUserId(), courseId);
            response.setFinalScore(fallbackScore);
        }

        if (response.getGrade() == null || response.getGrade().isBlank()) {
            response.setGrade(determineGrade(response.getFinalScore()));
        }

        response.setStudentName(resolveStudentName(certificate.getUserId()));
        return response;
    }

    private String resolveStudentName(String userId) {
        try {
            UserResponse user = userInfoApi.getUserInfo(userId).getResult();
            if (user == null) {
                return userId;
            }

            String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
            String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
            String fullName = (lastName + " " + firstName).trim();

            if (!fullName.isBlank()) {
                return fullName;
            }
            if (user.getUsername() != null && !user.getUsername().isBlank()) {
                return user.getUsername().trim();
            }
            if (user.getId() != null && !user.getId().isBlank()) {
                return user.getId();
            }
        } catch (Exception exception) {
            log.warn("Unable to resolve student name for userId={}", userId, exception);
        }

        return userId;
    }

    public PublicCertificateVerificationResponse verifyCertificatePublic(String code) {
        CertificateResponse certificate = getCertificateByCode(code);

        if (certificate == null) {
            try {
            Web3jService.OnChainCertificateData onChainData = web3jService.verifyCertificate(code);

            if (onChainData.isValid()) {
                CertificateResponse onChainCertificate = CertificateResponse.builder()
                    .userId(maskUserId(onChainData.getUserId()))
                    .courseId(onChainData.getPublishedCourseId())
                    .courseName("N/A")
                    .certificateCode(code)
                    .issueDate(onChainData.getIssueDate())
                    .contractAddress(web3jService.getContractAddress())
                    .status(CertificateStatus.ISSUED)
                    .build();

                return PublicCertificateVerificationResponse.builder()
                    .found(true)
                    .certificate(onChainCertificate)
                    .onChainChecked(true)
                    .onChainValid(true)
                    .dataMatched(null)
                    .onChainUserId(maskUserId(onChainData.getUserId()))
                    .onChainPublishedCourseId(onChainData.getPublishedCourseId())
                    .onChainIssueDate(onChainData.getIssueDate())
                    .message("Certificate found and validated from on-chain records")
                    .build();
            }

            return PublicCertificateVerificationResponse.builder()
                .found(false)
                .onChainChecked(true)
                .onChainValid(false)
                .dataMatched(null)
                .onChainUserId(maskUserId(onChainData.getUserId()))
                .onChainPublishedCourseId(onChainData.getPublishedCourseId())
                .onChainIssueDate(onChainData.getIssueDate())
                .message("Certificate not found in platform records and is invalid on-chain")
                .build();
            } catch (Exception exception) {
            log.warn("Certificate not found in DB and on-chain check failed. code={}", code, exception);
            return PublicCertificateVerificationResponse.builder()
                .found(false)
                .onChainChecked(false)
                .message("Certificate not found")
                .build();
            }
        }

        boolean onChainChecked = false;
        Boolean onChainValid = null;
        Boolean dataMatched = null;
        String onChainUserId = null;
        Integer onChainPublishedCourseId = null;
        Date onChainIssueDate = null;
        String message = "Certificate found in platform records";
        String maskedUserId = maskUserId(certificate.getUserId());

        try {
            Web3jService.OnChainCertificateData onChainData = web3jService.verifyCertificate(code);
            onChainChecked = true;
            onChainValid = onChainData.isValid();
            onChainUserId = onChainData.getUserId();
            onChainPublishedCourseId = onChainData.getPublishedCourseId();
            onChainIssueDate = onChainData.getIssueDate();

            boolean coreDataMatched = Objects.equals(certificate.getUserId(), onChainUserId)
                    && Objects.equals(certificate.getCourseId(), onChainPublishedCourseId);

            dataMatched = onChainData.isValid() && coreDataMatched;

            if (Boolean.TRUE.equals(dataMatched)) {
                message = "Chứng chỉ hợp lệ và khớp với dữ liệu trên blockchain";
            } else if (Boolean.TRUE.equals(onChainValid)) {
                message = "Chứng chỉ tồn tại trên blockchain nhưng không khớp với dữ liệu trên nền tảng";
            } else {
                message = "Chứng chỉ tồn tại nhưng không hợp lệ trên blockchain";
            }
        } catch (Exception exception) {
            log.warn("Unable to verify certificate on-chain. code={}", code, exception);
            message = "Certificate found in platform records. On-chain check is temporarily unavailable";
        }

        boolean txFailed = false;
        if (certificate.getTransactionHash() != null && !certificate.getTransactionHash().isBlank()) {
            Boolean txSuccess = web3jService.isTransactionSuccessful(certificate.getTransactionHash());
            if (Boolean.FALSE.equals(txSuccess)) {
                txFailed = true;
                onChainChecked = true;
                onChainValid = false;
                dataMatched = false;
                message = "Giao dịch cấp chứng chỉ trên blockchain đã thất bại (reverted).";
            }
        }

        CertificateResponse sanitizedCertificate = CertificateResponse.builder()
                .id(certificate.getId())
                .userId(maskedUserId)
                .courseId(certificate.getCourseId())
                .courseName(certificate.getCourseName())
                .certificateCode(certificate.getCertificateCode())
                .issueDate(certificate.getIssueDate())
                .transactionHash(certificate.getTransactionHash())
                .contractAddress(certificate.getContractAddress())
                .blockNumber(certificate.getBlockNumber())
                .finalScore(certificate.getFinalScore())
                .grade(certificate.getGrade())
                .status(txFailed ? CertificateStatus.FAILED : certificate.getStatus())
                .build();

        return PublicCertificateVerificationResponse.builder()
                .found(true)
                .certificate(sanitizedCertificate)
                .onChainChecked(onChainChecked)
                .onChainValid(onChainValid)
                .dataMatched(dataMatched)
                .onChainUserId(maskUserId(onChainUserId))
                .onChainPublishedCourseId(onChainPublishedCourseId)
                .onChainIssueDate(onChainIssueDate)
                .message(message)
                .build();
    }

    private boolean isPinataConfigured() {
        return pinataJwt != null && !pinataJwt.isBlank();
    }

    private String uploadPdfToPinata(String certificateCode, byte[] pdfBytes) {
        if (!isPinataConfigured()) {
            throw new RuntimeException("PINATA_JWT is not configured");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(pinataJwt);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource pdfResource = new ByteArrayResource(pdfBytes) {
                @Override
                public String getFilename() {
                    return "certificate-" + certificateCode + ".pdf";
                }
            };

            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.APPLICATION_PDF);
            fileHeaders.setContentDispositionFormData("file", pdfResource.getFilename());

            HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(pdfResource, fileHeaders);
            HttpEntity<String> metadataPart = new HttpEntity<>(objectMapper.writeValueAsString(buildPinataMetadata("certificate-" + certificateCode + ".pdf")), createJsonHeaders());
            HttpEntity<String> optionsPart = new HttpEntity<>("{\"cidVersion\":1}", createJsonHeaders());

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", filePart);
            body.add("pinataMetadata", metadataPart);
            body.add("pinataOptions", optionsPart);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<PinataPinResponse> response = restTemplate.postForEntity(
                    pinataApiUrl + "/pinning/pinFileToIPFS",
                    request,
                    PinataPinResponse.class
            );

            PinataPinResponse result = response.getBody();
            if (result == null || result.getIpfsHash() == null || result.getIpfsHash().isBlank()) {
                log.warn("Pinata PDF upload response did not contain an IPFS hash. status={}, body={}",
                        response.getStatusCode(), result);
                throw new RuntimeException("Pinata did not return an IPFS hash for the PDF");
            }

            return result.getIpfsHash();
        } catch (Exception exception) {
            throw new RuntimeException("Failed to upload certificate PDF to Pinata", exception);
        }
    }
    private String uploadMetadataToPinata(String certificateCode, HashMap<String, Object> metadataPayload) {
        if (!isPinataConfigured()) {
            throw new RuntimeException("PINATA_JWT is not configured");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(pinataJwt);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HashMap<String, Object> requestBody = new HashMap<>();
            requestBody.put("pinataContent", metadataPayload);
            requestBody.put("pinataMetadata", buildPinataMetadata("certificate-" + certificateCode + "-metadata.json"));
            requestBody.put("pinataOptions", java.util.Map.of("cidVersion", 1));

            HttpEntity<HashMap<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<PinataPinResponse> response = restTemplate.postForEntity(
                    pinataApiUrl + "/pinning/pinJSONToIPFS",
                    request,
                    PinataPinResponse.class
            );

            PinataPinResponse result = response.getBody();
            if (result == null || result.getIpfsHash() == null || result.getIpfsHash().isBlank()) {
                throw new RuntimeException("Pinata did not return an IPFS hash for the metadata");
            }

            return result.getIpfsHash();
        } catch (Exception exception) {
            throw new RuntimeException("Failed to upload certificate metadata to Pinata", exception);
        }
    }

    private HashMap<String, Object> buildPinataMetadata(String name) {
        HashMap<String, Object> metadata = new HashMap<>();
        metadata.put("name", name);
        metadata.put("keyvalues", java.util.Map.of("app", "course-management", "type", "certificate"));
        return metadata;
    }

    private HttpHeaders createJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String toIpfsUri(String ipfsHash) {
        return "ipfs://" + ipfsHash;
    }

    public PublicCertificateVerificationResponse verifyCertificatePublicByHash(String certificateHash) {
        CertificateResponse certificate = getCertificateByHash(certificateHash);

        if (certificate == null) {
            try {
                Web3jService.OnChainCertificateData onChainData = web3jService.verifyCertificateByHash(certificateHash);

                if (onChainData.isValid()) {
                    CertificateResponse onChainCertificate = CertificateResponse.builder()
                            .userId(maskUserId(onChainData.getUserId()))
                            .courseId(onChainData.getPublishedCourseId())
                            .courseName("N/A")
                            .certificateCode(null)
                            .issueDate(onChainData.getIssueDate())
                            .contractAddress(web3jService.getContractAddress())
                            .status(CertificateStatus.ISSUED)
                            .certificateHash(certificateHash)
                            .build();

                    return PublicCertificateVerificationResponse.builder()
                            .found(true)
                            .certificate(onChainCertificate)
                            .onChainChecked(true)
                            .onChainValid(true)
                            .dataMatched(null)
                            .onChainUserId(maskUserId(onChainData.getUserId()))
                            .onChainPublishedCourseId(onChainData.getPublishedCourseId())
                            .onChainIssueDate(onChainData.getIssueDate())
                            .message("Certificate hash found and validated from on-chain records")
                            .build();
                }

                return PublicCertificateVerificationResponse.builder()
                        .found(false)
                        .onChainChecked(true)
                        .onChainValid(false)
                        .dataMatched(null)
                        .message("Certificate hash not found or not valid on-chain")
                        .build();
            } catch (Exception exception) {
                log.warn("Certificate hash verification failed. hash={}", certificateHash, exception);
                return PublicCertificateVerificationResponse.builder()
                        .found(false)
                        .onChainChecked(false)
                        .message("Certificate hash not found")
                        .build();
            }
        }

        boolean onChainChecked = false;
        Boolean onChainValid = null;
        Boolean dataMatched = null;
        String onChainUserId = null;
        Integer onChainPublishedCourseId = null;
        Date onChainIssueDate = null;
        String message = "Certificate hash found in platform records";
        String maskedUserId = maskUserId(certificate.getUserId());

        try {
            Web3jService.OnChainCertificateData onChainData = web3jService.verifyCertificateByHash(certificateHash);
            onChainChecked = true;
            onChainValid = onChainData.isValid();
            onChainUserId = onChainData.getUserId();
            onChainPublishedCourseId = onChainData.getPublishedCourseId();
            onChainIssueDate = onChainData.getIssueDate();

            boolean coreDataMatched = Objects.equals(certificate.getUserId(), onChainUserId)
                    && Objects.equals(certificate.getCourseId(), onChainPublishedCourseId)
                    && Objects.equals(certificate.getCertificateHash(), certificateHash);

            dataMatched = onChainData.isValid() && coreDataMatched;

            if (Boolean.TRUE.equals(dataMatched)) {
                message = "Chứng chỉ hợp lệ và khớp với dữ liệu hash trên blockchain";
            } else if (Boolean.TRUE.equals(onChainValid)) {
                message = "Chứng chỉ tồn tại trên blockchain nhưng không khớp hoàn toàn với dữ liệu nền tảng";
            } else {
                message = "Chứng chỉ tồn tại nhưng không hợp lệ trên blockchain";
            }
        } catch (Exception exception) {
            log.warn("Unable to verify certificate hash on-chain. hash={}", certificateHash, exception);
            message = "Certificate hash found in platform records. On-chain check is temporarily unavailable";
        }

        boolean txFailed = false;
        if (certificate.getTransactionHash() != null && !certificate.getTransactionHash().isBlank()) {
            Boolean txSuccess = web3jService.isTransactionSuccessful(certificate.getTransactionHash());
            if (Boolean.FALSE.equals(txSuccess)) {
                txFailed = true;
                onChainChecked = true;
                onChainValid = false;
                dataMatched = false;
                message = "Giao dịch cấp chứng chỉ trên blockchain đã thất bại (reverted).";
            }
        }

        CertificateResponse sanitizedCertificate = CertificateResponse.builder()
                .id(certificate.getId())
                .userId(maskedUserId)
                .courseId(certificate.getCourseId())
                .courseName(certificate.getCourseName())
                .certificateCode(certificate.getCertificateCode())
                .issueDate(certificate.getIssueDate())
                .transactionHash(certificate.getTransactionHash())
                .contractAddress(certificate.getContractAddress())
                .blockNumber(certificate.getBlockNumber())
                .finalScore(certificate.getFinalScore())
                .grade(certificate.getGrade())
                .certificateHash(certificate.getCertificateHash())
                .pdfUrl(certificate.getPdfUrl())
                .tokenUri(certificate.getTokenUri())
                .tokenId(certificate.getTokenId())
                .status(txFailed ? CertificateStatus.FAILED : certificate.getStatus())
                .build();

        return PublicCertificateVerificationResponse.builder()
                .found(true)
                .certificate(sanitizedCertificate)
                .onChainChecked(onChainChecked)
                .onChainValid(onChainValid)
                .dataMatched(dataMatched)
                .onChainUserId(maskUserId(onChainUserId))
                .onChainPublishedCourseId(onChainPublishedCourseId)
                .onChainIssueDate(onChainIssueDate)
                .message(message)
                .build();
    }

    private String maskUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return "N/A";
        }

        int length = userId.length();
        if (length <= 2) {
            return "**";
        }

        int visibleTail = Math.min(3, Math.max(1, length / 3));
        String tail = userId.substring(length - visibleTail);
        return "***" + tail;
    }

    private String generateSha256Hex(String content) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = messageDigest.digest(content.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(hashBytes.length * 2);
            for (byte hashByte : hashBytes) {
                hex.append(String.format("%02x", hashByte));
            }
            return hex.toString();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to generate certificate hash", exception);
        }
    }

    private String generateTokenId(String certificateHash) {
        // Convert SHA-256 hash to a numeric token ID for NFT minting
        // Take first 16 chars of hash and convert hex to BigInteger
        try {
            String truncatedHash = certificateHash.substring(0, 16);
            // Convert hex to decimal BigInteger for ERC721 token ID
            return new java.math.BigInteger(truncatedHash, 16).toString();
        } catch (Exception e) {
            log.warn("Failed to generate token ID from hash, using fallback", e);
            return System.currentTimeMillis() + "";
        }
    }

    private String resolveStudentWallet(String userId) {
        try {
            // Try to get user info (may not include wallet if removed from identity service)
            UserResponse user = userInfoApi.getUserInfo(userId).getResult();
            if (user == null) {
                log.warn("Unable to resolve student wallet: user info not found for {}", userId);
            } else {
                log.info("User info fetched for {}, but no wallet field available in DTO", userId);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user info for {} when resolving wallet: {}", userId, e.getMessage());
        }

        // The platform requires the student to claim with a wallet address before issuance.
        throw new RuntimeException("Student wallet not available. Require student to claim certificate with a wallet before automatic issuance.");
    }

    public byte[] generateCertificatePdf(String certificateCode) {
        CertificateResponse cert = getCertificateByCode(certificateCode);
        if (cert == null) {
            throw new RuntimeException("Certificate not found: " + certificateCode);
        }

        return renderCertificatePdf(cert);
    }

    private byte[] renderCertificatePdf(CertificateResponse cert) {
        String html = generateCertificateHtml(cert);

        try {
            // Use Flying Saucer to convert XHTML to PDF
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to convert HTML to PDF for certificate: {}", cert.getCertificateCode(), e);
            // Fallback: return HTML as bytes if PDF generation fails
            log.warn("Falling back to HTML content");
            return html.getBytes(StandardCharsets.UTF_8);
        }
    }

    private String generateCertificateHtml(CertificateResponse cert) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
                "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta charset="UTF-8" />
                    <title>Certificate of Completion</title>
                    <style type="text/css">
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #f5f5f5;
                        }
                        .certificate {
                            max-width: 900px;
                            margin: 0 auto;
                            background-color: #4a5db8;
                            padding: 40px;
                            color: white;
                            text-align: center;
                            page-break-inside: avoid;
                        }
                        .certificate-header {
                            font-size: 36px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            color: #ffeb3b;
                        }
                        .certificate-body {
                            background-color: white;
                            color: #333;
                            padding: 40px;
                            margin-top: 20px;
                            page-break-inside: avoid;
                        }
                        .student-name {
                            font-size: 28px;
                            font-weight: bold;
                            color: #4a5db8;
                            margin: 20px 0;
                            border-bottom: 2px solid #4a5db8;
                            padding-bottom: 10px;
                        }
                        .course-info {
                            margin: 20px 0;
                            line-height: 1.8;
                            font-size: 14px;
                        }
                        .label {
                            font-weight: bold;
                            color: #4a5db8;
                        }
                        .blockchain-info {
                            background-color: #f0f0f0;
                            padding: 15px;
                            margin-top: 20px;
                            border-left: 4px solid #4a5db8;
                            text-align: left;
                            font-family: 'Courier New', monospace;
                            font-size: 11px;
                            page-break-inside: avoid;
                        }
                        .blockchain-info div {
                            margin: 5px 0;
                            word-break: break-all;
                        }
                        .footer {
                            margin-top: 30px;
                            color: #999;
                            font-size: 12px;
                            text-align: center;
                        }
                        .divider {
                            margin: 20px 0;
                            border-top: 1px solid #ddd;
                        }
                        p {
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="certificate">
                        <div class="certificate-header">Certificate of Completion</div>
                        <div class="certificate-body">
                            <p style="margin-top: 0;">This is to certify that</p>
                            <div class="student-name">%s</div>
                            <div class="course-info">
                                <p>Has successfully completed and met the requirements of the course</p>
                                <p style="font-size: 16px; font-weight: bold; margin: 15px 0;">%s</p>
                                <div class="divider"></div>
                                <p><span class="label">Final Grade:</span> %s</p>
                                <p><span class="label">Score:</span> %.2f%%</p>
                                <p><span class="label">Issue Date:</span> %s</p>
                            </div>
                            <div class="divider"></div>
                            <div class="blockchain-info">
                                <p style="margin-top: 0; font-weight: bold;">Blockchain Verification Details:</p>
                                <div><span class="label">Certificate Code:</span> %s</div>
                                <div><span class="label">Certificate Hash:</span> %s</div>
                                <div><span class="label">Token ID (NFT):</span> %s</div>
                                <div><span class="label">Transaction Hash:</span> %s</div>
                                <div><span class="label">Block Number:</span> %s</div>
                                <div><span class="label">Status:</span> %s</div>
                            </div>
                            <div class="footer">
                                <p>This certificate is verified and stored on the blockchain.</p>
                                <p>Generated: %s</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                cert.getStudentName(),
                cert.getCourseName(),
                cert.getGrade(),
                cert.getFinalScore(),
                cert.getIssueDate(),
                cert.getCertificateCode(),
                cert.getCertificateHash(),
                cert.getTokenId(),
                cert.getTransactionHash(),
                cert.getBlockNumber(),
                cert.getStatus(),
                new Date()
        );
    }

    private Double calculateStudentGrade(String userId, Integer courseId) {
        // --- 1. CALCULATE QUIZ AVERAGE (40%) ---
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        double totalQuizScore = 0.0;
        int quizCount = quizzes.size();
        
        if (quizCount > 0) {
            for (com.hoangphihiep.entity.Quiz quiz : quizzes) {
                List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdAndIdUserOrderBySubmittedAtDesc(quiz.getId(), userId);
                double maxScore = attempts.stream()
                        .mapToDouble(QuizAttempt::getScore)
                        .max()
                        .orElse(0.0);
                totalQuizScore += maxScore;
            }
        }
        double quizAvg = quizCount > 0 ? totalQuizScore / quizCount : 0.0;

        // --- 2. CALCULATE ASSIGNMENT AVERAGE ---
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        double totalAssignmentScore = 0.0;
        int assignmentCount = assignments.size();
        
        if (assignmentCount > 0) {
            for (Assignment assignment : assignments) {
                // Find submission score
                 AssignmentSubmission submission = assignmentSubmissionRepository.findByAssignmentIdAndIdUser(assignment.getId(), userId)
                         .orElse(null);
                
                 if (submission != null && submission.getScore() != null) {
                     totalAssignmentScore += submission.getScore();
                 }
            }
        }
        double assignmentAvg = assignmentCount > 0 ? totalAssignmentScore / assignmentCount : 0.0;

        final double DEFAULT_QUIZ_WEIGHT = 0.4;
        final double DEFAULT_ASSIGNMENT_WEIGHT = 0.5;
        final double DEFAULT_LESSON_WEIGHT = 0.1;

        // Compute lesson completion score (0-10)
        List<Lesson> allLessons = lessonRepository.findByCourseId(courseId);
        int totalLessons = allLessons.size();
        double lessonScore = 0.0;
        boolean hasLessons = totalLessons > 0;
        if (hasLessons) {
            List<LessonProgress> lessonProgresses = lessonProgressRepository.findByUserIdAndCourseId(userId, courseId);
            long completedLessons = lessonProgresses.stream()
                    .filter(LessonProgress::getCompleted)
                    .count();
            double completionRate = (double) completedLessons / totalLessons;
            lessonScore = completionRate * 10.0; // scale to 0-10
        }

        boolean hasQuiz = quizCount > 0;
        boolean hasAssignment = assignmentCount > 0;

        // If no quiz and no assignment and lessons exist, rely on lesson score
        if (!hasQuiz && !hasAssignment) {
            if (hasLessons) return lessonScore;
            return 0.0;
        }

        double wQuiz = hasQuiz ? DEFAULT_QUIZ_WEIGHT : 0.0;
        double wAssignment = hasAssignment ? DEFAULT_ASSIGNMENT_WEIGHT : 0.0;
        double wLesson = hasLessons ? DEFAULT_LESSON_WEIGHT : 0.0;

        double sumW = wQuiz + wAssignment + wLesson;
        if (sumW <= 0) return 0.0;

        wQuiz = wQuiz / sumW;
        wAssignment = wAssignment / sumW;
        wLesson = wLesson / sumW;

        double finalScore = 0.0;
        if (hasQuiz) finalScore += quizAvg * wQuiz;
        if (hasAssignment) finalScore += assignmentAvg * wAssignment;
        if (hasLessons) finalScore += lessonScore * wLesson;

        return finalScore;
    }

    private String determineGrade(Double score) {
        if (score == null) return "N/A";
        if (score >= 9.0) return "Xuất sắc (Excellent)";
        if (score >= 8.0) return "Giỏi (Good)";
        if (score >= 6.5) return "Khá (Merit)";
        if (score >= 5.0) return "Trung bình (Average)";
        return "Yếu (Fail)";
    }


}
