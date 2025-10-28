package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.AssignmentResponse;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.entity.Assignment;
import com.hoangphihiep.entity.AssignmentSubmission;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.AssignmentMapper;
import com.hoangphihiep.mapper.AssignmentSubmissionMapper;
import com.hoangphihiep.repository.AssignmentRepository;
import com.hoangphihiep.repository.AssignmentSubmissionRepository;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentSubmissionMapper submissionMapper;
    private final UserInfoApi userInfoApi;

    public AssignmentResponse getAssignmentById(Integer id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));
        return assignmentMapper.toAssignmentResponse(assignment);
    }

    public List<AssignmentResponse> getAssignmentsBySectionId(Integer sectionId) {
        return assignmentRepository.findBySectionId(sectionId)
                .stream()
                .map(assignmentMapper::toAssignmentResponse)
                .toList();
    }

    @Transactional
    public AssignmentSubmissionResponse submitAssignment(AssignmentSubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Kiểm tra deadline
        if (new Date().after(assignment.getDeadline())) {
            log.warn("Submission after deadline for assignment: {}", assignment.getId());
        }

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndIdUser(request.getAssignmentId(), request.getIdUser())
                .orElse(new AssignmentSubmission());

        submission.setAssignment(assignment);
        submission.setIdUser(request.getIdUser());
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionFiles(request.getSubmissionFiles());
        submission.setSubmissionLink(request.getSubmissionLink());
        submission.setSubmittedAt(new Date());
        submission.setStatus(new Date().after(assignment.getDeadline()) ? "LATE" : "SUBMITTED");

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Map to response và lấy userName
        AssignmentSubmissionResponse response = submissionMapper.toAssignmentSubmissionResponse(saved);
        enrichWithUserName(response, saved.getIdUser());

        return response;
    }

    public List<AssignmentSubmissionResponse> getSubmissionsByAssignmentId(Integer assignmentId) {
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);

        return submissions.stream()
                .map(submission -> {
                    AssignmentSubmissionResponse response = submissionMapper.toAssignmentSubmissionResponse(submission);
                    enrichWithUserName(response, submission.getIdUser());
                    return response;
                })
                .collect(Collectors.toList());
    }

    public List<AssignmentSubmissionResponse> getSubmissionsByUserId(String idUser) {
        List<AssignmentSubmission> submissions = submissionRepository.findByIdUser(idUser);

        return submissions.stream()
                .map(submission -> {
                    AssignmentSubmissionResponse response = submissionMapper.toAssignmentSubmissionResponse(submission);
                    enrichWithUserName(response, submission.getIdUser());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(Integer submissionId, Double score, String feedback) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setGradedAt(new Date());
        submission.setStatus("GRADED");

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Map to response và lấy userName
        AssignmentSubmissionResponse response = submissionMapper.toAssignmentSubmissionResponse(saved);
        enrichWithUserName(response, saved.getIdUser());

        return response;
    }

    /**
     * Lấy userName từ Identity Service và set vào response
     */
    private void enrichWithUserName(AssignmentSubmissionResponse response, String idUser) {
        try {
            var userResponse = userInfoApi.getUserInfo(idUser);
            if (userResponse != null && userResponse.getResult() != null) {
                UserResponse user = userResponse.getResult();
                // Giả sử UserResponse có field username hoặc firstName + lastName
                response.setUserName(user.getUsername()); // hoặc user.getFirstName() + " " + user.getLastName()
            }
        } catch (Exception e) {
            log.error("Error fetching user info for idUser: {}", idUser, e);
            response.setUserName("Unknown User");
        }
    }
}