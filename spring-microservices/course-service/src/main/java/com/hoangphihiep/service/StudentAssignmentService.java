package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.entity.Assignment;
import com.hoangphihiep.entity.AssignmentSubmission;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.AssignmentSubmissionMapper;
import com.hoangphihiep.repository.AssignmentRepository;
import com.hoangphihiep.repository.AssignmentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentSubmissionMapper submissionMapper;

    /**
     * Get assignment detail with user's submission
     */
    public Map<String, Object> getAssignmentDetail(Integer assignmentId) {
        String userId = getCurrentUserId();

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Get user's submission if exists
        AssignmentSubmission mySubmission = submissionRepository
                .findByAssignmentIdAndIdUser(assignmentId, userId)
                .orElse(null);

        // Calculate deadline info
        Date now = new Date();
        Date deadline = assignment.getDeadline();
        boolean isLate = now.after(deadline);
        long daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        Map<String, Object> result = new HashMap<>();
        result.put("id", assignment.getId());
        result.put("title", assignment.getTitle());
        result.put("description", assignment.getDescription());
        result.put("deadline", assignment.getDeadline());
        result.put("assignmentFiles", assignment.getAssignmentFiles());
        result.put("submissionType", assignment.getSubmissionType());
        result.put("rubricFiles", assignment.getRubricFiles());
        result.put("maxScore", assignment.getMaxScore());
        result.put("isLate", isLate);
        result.put("daysUntilDeadline", daysUntilDeadline);
        result.put("canSubmit", !isLate || mySubmission != null); // Can update if already submitted late

        if (mySubmission != null) {
            result.put("mySubmission", submissionMapper.toAssignmentSubmissionResponse(mySubmission));
        }

        return result;
    }

    /**
     * Get my submission for an assignment
     */
    public AssignmentSubmissionResponse getMySubmission(Integer assignmentId) {
        String userId = getCurrentUserId();

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndIdUser(assignmentId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        return submissionMapper.toAssignmentSubmissionResponse(submission);
    }

    /**
     * Submit assignment
     */
    @Transactional
    public AssignmentSubmissionResponse submitAssignment(
            Integer assignmentId,
            AssignmentSubmissionRequest request) {

        String userId = getCurrentUserId();

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Check if already submitted
        submissionRepository.findByAssignmentIdAndIdUser(assignmentId, userId)
                .ifPresent(s -> {
                    throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_SUBMITTED);
                });

        // Determine status
        Date now = new Date();
        String status = now.after(assignment.getDeadline()) ? "LATE" : "SUBMITTED";

        // Create submission
        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setIdUser(userId);
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionFiles(request.getSubmissionFiles());
        submission.setSubmissionLink(request.getSubmissionLink());
        submission.setSubmittedAt(now);
        submission.setStatus(status);

        AssignmentSubmission saved = submissionRepository.save(submission);

        log.info("User {} submitted assignment {}", userId, assignmentId);

        return submissionMapper.toAssignmentSubmissionResponse(saved);
    }

    /**
     * Update submission (before grading)
     */
    @Transactional
    public AssignmentSubmissionResponse updateSubmission(
            Integer submissionId,
            AssignmentSubmissionRequest request) {

        String userId = getCurrentUserId();

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Verify ownership
        if (!submission.getIdUser().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if already graded
        if (submission.getScore() != null) {
            throw new AppException(ErrorCode.SUBMISSION_ALREADY_GRADED);
        }

        // Update submission
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionFiles(request.getSubmissionFiles());
        submission.setSubmissionLink(request.getSubmissionLink());
        submission.setSubmittedAt(new Date()); // Update submission time

        // Update status if needed
        Date now = new Date();
        if (now.after(submission.getAssignment().getDeadline())) {
            submission.setStatus("LATE");
        }

        AssignmentSubmission updated = submissionRepository.save(submission);

        log.info("User {} updated submission {}", userId, submissionId);

        return submissionMapper.toAssignmentSubmissionResponse(updated);
    }

    /**
     * Delete submission (before grading)
     */
    @Transactional
    public void deleteSubmission(Integer submissionId) {
        String userId = getCurrentUserId();

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Verify ownership
        if (!submission.getIdUser().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if already graded
        if (submission.getScore() != null) {
            throw new AppException(ErrorCode.SUBMISSION_ALREADY_GRADED);
        }

        submissionRepository.delete(submission);

        log.info("User {} deleted submission {}", userId, submissionId);
    }

    /**
     * Get all my submissions
     */
    public List<AssignmentSubmissionResponse> getMySubmissions() {
        String userId = getCurrentUserId();

        List<AssignmentSubmission> submissions = submissionRepository.findByIdUser(userId);

        return submissions.stream()
                .map(submissionMapper::toAssignmentSubmissionResponse)
                .collect(Collectors.toList());
    }

    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}