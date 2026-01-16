package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.GradeAssignmentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.AssignmentResponse;
import com.hoangphihiep.dto.response.AssignmentGradingResponse;
import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.service.TeacherAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher/assignments")
@RequiredArgsConstructor
@Slf4j
public class TeacherAssignmentController {

    private final TeacherAssignmentService teacherAssignmentService;

    /**
     * Get all assignments for a class (for discussion view)
     * GET /api/teacher/assignments/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ApiResponse<List<AssignmentResponse>> getAssignmentsByClass(
            @PathVariable Integer classId) {

        log.info("GET assignments for class: {}", classId);

        List<AssignmentResponse> assignments =
                teacherAssignmentService.getAssignmentsByClass(classId);

        return ApiResponse.<List<AssignmentResponse>>builder()
                .result(assignments)
                .build();
    }

    /**
     * Get all submissions for grading in a class
     * GET /api/teacher/assignments/class/{classId}/submissions
     */
    @GetMapping("/class/{classId}/submissions")
    public ApiResponse<List<AssignmentGradingResponse>> getSubmissionsForGrading(
            @PathVariable Integer classId) {

        log.info("Fetching submissions for grading in class: {}", classId);

        List<AssignmentGradingResponse> submissions =
                teacherAssignmentService.getSubmissionsForGrading(classId);

        return ApiResponse.<List<AssignmentGradingResponse>>builder()
                .result(submissions)
                .build();
    }

    /**
     * Get submissions for a specific assignment
     * GET /api/teacher/assignments/{assignmentId}/class/{classId}/submissions
     */
    @GetMapping("/{assignmentId}/class/{classId}/submissions")
    public ApiResponse<List<AssignmentSubmissionResponse>> getSubmissionsByAssignment(
            @PathVariable Integer assignmentId,
            @PathVariable Integer classId) {

        log.info("Fetching submissions for assignment {} in class {}", assignmentId, classId);

        List<AssignmentSubmissionResponse> submissions =
                teacherAssignmentService.getSubmissionsByAssignment(assignmentId, classId);

        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(submissions)
                .build();
    }

    /**
     * Grade a submission
     * POST /api/teacher/assignments/submissions/{submissionId}/grade
     */
    @PostMapping("/submissions/{submissionId}/grade")
    public ApiResponse<AssignmentSubmissionResponse> gradeSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody GradeAssignmentRequest request) {

        log.info("Grading submission: {}", submissionId);

        // Set submission ID from path variable
        request.setSubmissionId(submissionId);

        AssignmentSubmissionResponse response =
                teacherAssignmentService.gradeSubmission(submissionId, request);

        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Bulk grade multiple submissions
     * POST /api/teacher/assignments/submissions/bulk-grade
     */
    @PostMapping("/submissions/bulk-grade")
    public ApiResponse<List<AssignmentSubmissionResponse>> bulkGradeSubmissions(
            @Valid @RequestBody List<GradeAssignmentRequest> requests) {

        log.info("Bulk grading {} submissions", requests.size());

        List<AssignmentSubmissionResponse> responses =
                teacherAssignmentService.bulkGradeSubmissions(requests);

        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(responses)
                .build();
    }

    /**
     * Get grading statistics for a class
     * GET /api/teacher/assignments/class/{classId}/statistics
     */
    @GetMapping("/class/{classId}/statistics")
    public ApiResponse<Map<String, Object>> getGradingStatistics(
            @PathVariable Integer classId) {

        log.info("Fetching grading statistics for class: {}", classId);
        Map<String, Object> statistics =
                teacherAssignmentService.getGradingStatistics(classId);

        return ApiResponse.<Map<String, Object>>builder()
                .result(statistics)
                .build();
    }

    /**
     * Get submission detail
     * GET /api/teacher/assignments/submissions/{submissionId}
     */
    @GetMapping("/submissions/{submissionId}")
    public ApiResponse<AssignmentSubmissionResponse> getSubmissionDetail(
            @PathVariable Integer submissionId) {

        log.info("Fetching submission detail: {}", submissionId);

        // This can reuse the existing service method or create a new one
        // For now, returning basic info
        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(null) // Implement if needed
                .build();
    }
}