package com.hoangphihiep.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.entity.Assignment;
import com.hoangphihiep.entity.AssignmentSubmission;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.AssignmentSubmissionMapper;
import com.hoangphihiep.repository.AssignmentRepository;
import com.hoangphihiep.repository.AssignmentSubmissionRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentSubmissionMapper submissionMapper;
    private final FileHandlerRepository fileHandlerRepository;

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
            AssignmentSubmissionRequest request,
            List<MultipartFile> files) {

        String userId = getCurrentUserId();

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Check if already submitted
        submissionRepository.findByAssignmentIdAndIdUser(assignmentId, userId)
                .ifPresent(s -> {
                    throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_SUBMITTED);
                });

        // Upload files if provided
        List<String> fileUrls = null;
        if (files != null && !files.isEmpty()) {
            fileUrls = files.stream()
                    .map(file -> {
                        try {
                            Map<String, String> result = fileHandlerRepository.uploadFile(file);
                            return result.get("url");
                        } catch (Exception e) {
                            log.error("Error uploading file: {}", e.getMessage());
                            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
                        }
                    })
                    .collect(Collectors.toList());
        }

        // Determine status
        Date now = new Date();
        String status = now.after(assignment.getDeadline()) ? "LATE" : "SUBMITTED";

        // Create submission
        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setIdUser(userId);
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionFiles(fileUrls);
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
            AssignmentSubmissionRequest request,
            List<MultipartFile> newFiles,
            String existingFilesJson) {

        String userId = getCurrentUserId();

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Verify ownership
        if (!submission.getIdUser().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Parse existing files
        List<String> existingFiles = new ArrayList<>();
        if (existingFilesJson != null && !existingFilesJson.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                existingFiles = mapper.readValue(existingFilesJson, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.error("Error parsing existing files JSON: {}", e.getMessage());
            }
        }

        // Upload new files
        List<String> newFileUrls = new ArrayList<>();
        if (newFiles != null && !newFiles.isEmpty()) {
            newFileUrls = newFiles.stream()
                    .map(file -> {
                        try {
                            Map<String, String> result = fileHandlerRepository.uploadFile(file);
                            return result.get("url");
                        } catch (Exception e) {
                            log.error("Error uploading file: {}", e.getMessage());
                            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
                        }
                    })
                    .collect(Collectors.toList());
        }

        // Combine existing and new files
        List<String> allFiles = new ArrayList<>(existingFiles);
        allFiles.addAll(newFileUrls);

        // Update submission
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionFiles(allFiles.isEmpty() ? null : allFiles);
        submission.setSubmissionLink(request.getSubmissionLink());

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