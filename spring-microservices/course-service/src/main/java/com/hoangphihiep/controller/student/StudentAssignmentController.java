package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.service.StudentAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/assignments")
@RequiredArgsConstructor
public class StudentAssignmentController {

    private final StudentAssignmentService studentAssignmentService;

    @GetMapping("/{assignmentId}")
    public ApiResponse<Map<String, Object>> getAssignmentDetail(@PathVariable Integer assignmentId) {
        return ApiResponse.<Map<String, Object>>builder()
                .result(studentAssignmentService.getAssignmentDetail(assignmentId))
                .build();
    }

    @GetMapping("/{assignmentId}/my-submission")
    public ApiResponse<AssignmentSubmissionResponse> getMySubmission(@PathVariable Integer assignmentId) {
        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(studentAssignmentService.getMySubmission(assignmentId))
                .build();
    }

    @PostMapping("/{assignmentId}/submit")
    public ApiResponse<AssignmentSubmissionResponse> submitAssignment(
            @PathVariable Integer assignmentId,
            @Valid @RequestBody AssignmentSubmissionRequest request) {
        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(studentAssignmentService.submitAssignment(assignmentId, request))
                .build();
    }

    @PutMapping("/submissions/{submissionId}")
    public ApiResponse<AssignmentSubmissionResponse> updateSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody AssignmentSubmissionRequest request) {
        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(studentAssignmentService.updateSubmission(submissionId, request))
                .build();
    }

    @DeleteMapping("/submissions/{submissionId}")
    public ApiResponse<Void> deleteSubmission(@PathVariable Integer submissionId) {
        studentAssignmentService.deleteSubmission(submissionId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/my-submissions")
    public ApiResponse<List<AssignmentSubmissionResponse>> getMySubmissions() {
        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(studentAssignmentService.getMySubmissions())
                .build();
    }
}
