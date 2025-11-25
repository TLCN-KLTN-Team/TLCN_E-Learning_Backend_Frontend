package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.AssignmentSubmissionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.service.UserAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user/assignments")
@RequiredArgsConstructor
public class UserAssignmentController {

    private final UserAssignmentService userAssignmentService;

    @GetMapping("/{assignmentId}")
    public ApiResponse<Map<String, Object>> getAssignmentDetail(@PathVariable Integer assignmentId) {
        return ApiResponse.<Map<String, Object>>builder()
                .result(userAssignmentService.getAssignmentDetail(assignmentId))
                .build();
    }

    @GetMapping("/{assignmentId}/my-submission")
    public ApiResponse<AssignmentSubmissionResponse> getMySubmission(@PathVariable Integer assignmentId) {
        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(userAssignmentService.getMySubmission(assignmentId))
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
                .result(userAssignmentService.submitAssignment(assignmentId, request, submissionFiles))
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
                .result(userAssignmentService.updateSubmission(submissionId, request, submissionFiles, existingFilesJson))
                .build();
    }

    @DeleteMapping("/submissions/{submissionId}")
    public ApiResponse<Void> deleteSubmission(@PathVariable Integer submissionId) {
        userAssignmentService.deleteSubmission(submissionId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/my-submissions")
    public ApiResponse<List<AssignmentSubmissionResponse>> getMySubmissions() {
        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(userAssignmentService.getMySubmissions())
                .build();
    }
}
