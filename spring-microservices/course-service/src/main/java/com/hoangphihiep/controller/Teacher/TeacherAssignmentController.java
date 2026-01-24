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

    @GetMapping("/class/{classId}")
    public ApiResponse<List<AssignmentResponse>> getAssignmentsByClass(
            @PathVariable Integer classId) {

        List<AssignmentResponse> assignments =
                teacherAssignmentService.getAssignmentsByClass(classId);

        return ApiResponse.<List<AssignmentResponse>>builder()
                .result(assignments)
                .build();
    }

    @GetMapping("/class/{classId}/submissions")
    public ApiResponse<List<AssignmentGradingResponse>> getSubmissionsForGrading(
            @PathVariable Integer classId) {

        List<AssignmentGradingResponse> submissions =
                teacherAssignmentService.getSubmissionsForGrading(classId);

        return ApiResponse.<List<AssignmentGradingResponse>>builder()
                .result(submissions)
                .build();
    }

    @GetMapping("/{assignmentId}/class/{classId}/submissions")
    public ApiResponse<List<AssignmentSubmissionResponse>> getSubmissionsByAssignment(
            @PathVariable Integer assignmentId,
            @PathVariable Integer classId) {

        List<AssignmentSubmissionResponse> submissions =
                teacherAssignmentService.getSubmissionsByAssignment(assignmentId, classId);

        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(submissions)
                .build();
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ApiResponse<AssignmentSubmissionResponse> gradeSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody GradeAssignmentRequest request) {

        request.setSubmissionId(submissionId);

        AssignmentSubmissionResponse response =
                teacherAssignmentService.gradeSubmission(submissionId, request);

        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/submissions/bulk-grade")
    public ApiResponse<List<AssignmentSubmissionResponse>> bulkGradeSubmissions(
            @Valid @RequestBody List<GradeAssignmentRequest> requests) {

        List<AssignmentSubmissionResponse> responses =
                teacherAssignmentService.bulkGradeSubmissions(requests);

        return ApiResponse.<List<AssignmentSubmissionResponse>>builder()
                .result(responses)
                .build();
    }

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

    @GetMapping("/submissions/{submissionId}")
    public ApiResponse<AssignmentSubmissionResponse> getSubmissionDetail(
            @PathVariable Integer submissionId) {

        log.info("Fetching submission detail: {}", submissionId);

        return ApiResponse.<AssignmentSubmissionResponse>builder()
                .result(null)
                .build();
    }
}