package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.CertificateResponse;
import com.hoangphihiep.dto.response.PublicCertificateVerificationResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import com.hoangphihiep.service.blockchain.Web3jService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final ConcurrentMap<String, Object> issuanceLocks = new ConcurrentHashMap<>();

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

    @Async
    public void issueCertificateAsync(String userId, Integer publishedCourseId) {
        log.info("Starting Async Certificate Issuance for User: {} - PublishedCourse: {}", userId, publishedCourseId);

        String lockKey = userId + ":" + publishedCourseId;
        Object lock = issuanceLocks.computeIfAbsent(lockKey, key -> new Object());

        synchronized (lock) {
            try {
                // 1. Check if certificate exists
                var existingCert = certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId);
                
                if (existingCert.isPresent()) {
                    Certificate cert = existingCert.get();
                    // Allow retry if previous attempt failed
                    if (cert.getStatus() == Certificate.CertificateStatus.FAILED) {
                        log.info("Previous certificate issuance FAILED for User {} PublishedCourse {}. Deleting and retrying...", userId, publishedCourseId);
                        certificateRepository.delete(cert);
                    } else {
                        log.info("Certificate already exists with status {} for User {} PublishedCourse {}", cert.getStatus(), userId, publishedCourseId);
                        return;
                    }
                }

                PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                        .orElseThrow(() -> new RuntimeException("Published Course not found"));

                Integer courseId = publishedCourse.getCourse().getId();
                Double finalScore = calculateStudentGrade(userId, courseId);
                String grade = determineGrade(finalScore);

                // 2. Create Pending Certificate
                Certificate certificate = Certificate.builder()
                        .userId(userId)
                        .publishedCourse(publishedCourse)
                        .certificateCode(UUID.randomUUID().toString())
                        .issueDate(new Date())
                        .status(Certificate.CertificateStatus.PENDING)
                        .finalScore(finalScore)
                        .grade(grade)
                        .build();

                certificate = certificateRepository.save(certificate);

                // 3. Interact with Blockchain
                try {
                    String payload = certificate.getCertificateCode() + ":" + userId + ":" + publishedCourseId + ":" + certificate.getIssueDate().getTime();
                    String certificateHash = generateSha256Hex(payload);

                    String txHash = issueCertificateWithRecovery(certificate.getCertificateCode(), userId, publishedCourseId, certificateHash);

                    // 4. Update Certificate on confirmed success
                    certificate.setTransactionHash(txHash);
                    certificate.setContractAddress(web3jService.getContractAddress());
                    certificate.setStatus(Certificate.CertificateStatus.ISSUED);

                    BigInteger blockParam = web3jService.getBlockNumber(txHash);
                    certificate.setBlockNumber(blockParam);

                    certificateRepository.save(certificate);

                    log.info("Certificate Issued Successfully! Tx: {}", txHash);

                } catch (Exception e) {
                    log.error("Failed to issue blockchain certificate after all retries", e);
                    certificate.setStatus(Certificate.CertificateStatus.FAILED);
                    certificateRepository.save(certificate);
                }
            } finally {
                issuanceLocks.remove(lockKey, lock);
            }
        }
    }

    /**
     * Attempts to issue a certificate with recovery logic for "already issued" errors
     */
    private String issueCertificateWithRecovery(String certificateCode, String userId, Integer publishedCourseId, String certificateHash) throws Exception {
        try {
            // First attempt
            return web3jService.issueCertificateTransaction(certificateCode, userId, publishedCourseId, certificateHash);
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            
            // If certificate already issued on-chain, try to revoke and retry
            if (errorMsg.contains("Certificate already issued")) {
                log.warn("Certificate already issued on-chain for User {} Course {}. Attempting to revoke and retry...", userId, publishedCourseId);
                try {
                    web3jService.revokeCertificateClaim(userId, publishedCourseId);
                    log.info("Successfully revoked certificate claim. Retrying issuance...");
                    Thread.sleep(2000); // Wait briefly for state consistency
                    return web3jService.issueCertificateTransaction(certificateCode, userId, publishedCourseId, certificateHash);
                } catch (Exception revokeException) {
                    log.error("Failed to revoke certificate claim", revokeException);
                    throw new RuntimeException("Failed to recover from 'already issued' status and could not revoke claim: " + revokeException.getMessage());
                }
            }
            
            // For other errors, just rethrow
            throw e;
        }
    }

    public CertificateResponse getCertificate(String userId, Integer publishedCourseId) {
        return certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId)
                // Removed filter to allow PENDING/FAILED status to be seen by frontend
                .map(this::toCertificateResponse)
                .orElse(null);
    }
    
    public CertificateResponse getCertificateByCode(String code) {
         return certificateRepository.findByCertificateCode(code)
                 .map(this::toCertificateResponse)
                 .orElse(null);
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
                    .status(Certificate.CertificateStatus.ISSUED)
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
                message = "Certificate is valid and matched with on-chain records";
            } else if (Boolean.TRUE.equals(onChainValid)) {
                message = "On-chain certificate exists but does not match platform records";
            } else {
                message = "Certificate exists but is not valid on-chain";
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
                .status(txFailed ? Certificate.CertificateStatus.FAILED : certificate.getStatus())
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

        // --- 2. CALCULATE ASSIGNMENT AVERAGE (60%) ---
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

        // --- 3. FINAL WEIGHTED SCORE ---
        // Rule: If only one type exists, it takes 100%
        if (quizCount == 0 && assignmentCount == 0) {
            // Fallback: calculate based on lesson completion
            return calculateLessonCompletionScore(userId, courseId);
        }
        if (quizCount == 0) return assignmentAvg;
        if (assignmentCount == 0) return quizAvg;

        return (quizAvg * 0.4) + (assignmentAvg * 0.6);
    }

    private Double calculateLessonCompletionScore(String userId, Integer courseId) {
        // Get all lessons in the course
        List<Lesson> allLessons = lessonRepository.findByCourseId(courseId);
        int totalLessons = allLessons.size();
        
        if (totalLessons == 0) {
            log.warn("No lessons found in course {}. Cannot calculate completion score.", courseId);
            return 0.0;
        }
        
        // Get user's lesson progress
        List<LessonProgress> lessonProgresses = lessonProgressRepository.findByUserIdAndCourseId(userId, courseId);
        long completedLessons = lessonProgresses.stream()
                .filter(LessonProgress::getCompleted)
                .count();
        
        // Calculate score based on completion percentage (scale 0-10)
        double completionRate = (double) completedLessons / totalLessons;
        double score = completionRate * 10.0;
        
        log.info("User {} completed {}/{} lessons in course {}. Score: {}", 
                userId, completedLessons, totalLessons, courseId, score);
        
        return score;
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
