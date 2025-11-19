package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.service.StudentAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/{assignmentId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AssignmentSubmissionResponse> submitAssignment(
            @PathVariable Integer assignmentId,
            @RequestPart(value = "submissionText", required = false) String submissionText,
            @RequestPart(value = "submissionFiles", required = false) List<MultipartFile> submissionFiles,
            @RequestPart(value = "submissionLink", required = false) String submissionLink) {

        AssignmentSubmissionRequest request = AssignmentSubmissionRequest.builder()
                .assignmentId(assignmentId)
                .submissionText(submissionText)
                .submissionLink(submissionLink)
                .build();

        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(studentAssignmentService.submitAssignment(assignmentId, request, submissionFiles))
                .build();
    }

    @PutMapping(value = "/submissions/{submissionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AssignmentSubmissionResponse> updateSubmission(
            @PathVariable Integer submissionId,
            @RequestPart(value = "submissionText", required = false) String submissionText,
            @RequestPart(value = "submissionFiles", required = false) List<MultipartFile> submissionFiles,
            @RequestPart(value = "submissionLink", required = false) String submissionLink,
            @RequestPart(value = "existingFiles", required = false) String existingFilesJson) {

        AssignmentSubmissionRequest request = AssignmentSubmissionRequest.builder()
                .submissionText(submissionText)
                .submissionLink(submissionLink)
                .build();

        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(studentAssignmentService.updateSubmission(submissionId, request, submissionFiles, existingFilesJson))
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
