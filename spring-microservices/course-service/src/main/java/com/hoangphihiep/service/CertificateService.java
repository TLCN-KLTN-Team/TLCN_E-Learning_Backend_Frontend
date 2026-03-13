package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.CertificateResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.service.blockchain.Web3jService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final Web3jService web3jService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Async
    public void issueCertificateAsync(String userId, Integer publishedCourseId) {
        log.info("Starting Async Certificate Issuance for User: {} - PublishedCourse: {}", userId, publishedCourseId);

        // 1. Check if certificate exists
        if (certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId).isPresent()) {
            log.info("Certificate already exists for User {} PublishedCourse {}", userId, publishedCourseId);
            return;
        }

        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new RuntimeException("Published Course not found"));
        
        // Let's implement a helper to calculate score.
        Double finalScore = calculateStudentGrade(userId, publishedCourseId);
        String grade = determineGrade(finalScore);
        // --- GRADING LOGIC END ---

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
            // Generate content to hash (Code + UserId + CourseId + Date)
            // Generate content to hash (Code + UserId + PublishedCourseId + Date)
            String contentToHash = certificate.getCertificateCode() + ":" + userId + ":" + publishedCourseId + ":" + certificate.getIssueDate().getTime();
            
            // Send to Blockchain
            String txHash = web3jService.issueCertificateTransaction(
                    certificate.getCertificateCode(), 
                    userId, 
                    publishedCourseId, 
                    contentToHash
            );
            
            // 4. Update Certificate on Success
            certificate.setTransactionHash(txHash);
            certificate.setStatus(Certificate.CertificateStatus.ISSUED);
            
            // Try to get block number immediately (might be null if pending, can be updated later or ignored for now)
            BigInteger blockParam = web3jService.getBlockNumber(txHash);
            certificate.setBlockNumber(blockParam);

            certificateRepository.save(certificate);
            
            log.info("Certificate Issued Successfully! Tx: {}", txHash);

        } catch (Exception e) {
            log.error("Failed to issue blockchain certificate", e);
            certificate.setStatus(Certificate.CertificateStatus.FAILED);
            certificateRepository.save(certificate);
        }
    }

    public CertificateResponse getCertificate(String userId, Integer publishedCourseId) {
        return certificateRepository.findByUserIdAndPublishedCourse_Id(userId, publishedCourseId)
                // Removed filter to allow PENDING/FAILED status to be seen by frontend
                .map(CertificateResponse::fromEntity)
                .orElse(null);
    }
    
    public CertificateResponse getCertificateByCode(String code) {
         return certificateRepository.findByCertificateCode(code)
                 .map(CertificateResponse::fromEntity)
                 .orElse(null);
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
