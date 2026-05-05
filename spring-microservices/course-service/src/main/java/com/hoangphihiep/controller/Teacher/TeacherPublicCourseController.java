package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.GradeAssignmentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.TeacherPublicCourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher/public")
@RequiredArgsConstructor
@Slf4j
public class TeacherPublicCourseController {

    private final TeacherPublicCourseService publicCourseService;
    @GetMapping("/courses/{teacherId}")
    public ApiResponse<Page<PublicCourseResponse>> getPublicCourses(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String creditRange,
            @RequestParam(required = false) String updatedRange) {

        Page<PublicCourseResponse> courses = publicCourseService.getPublicCoursesByTeacher(teacherId, page, size, search, creditRange, updatedRange);

        return ApiResponse.<Page<PublicCourseResponse>>builder()
                .message("Get public courses successfully")
                .result(courses)
                .build();
    }

    @GetMapping("/courses/{courseId}/students")
    public ApiResponse<List<PublicCourseStudentResponse>> getCourseStudents(
            @PathVariable Integer courseId) {

        List<PublicCourseStudentResponse> students = publicCourseService.getCourseStudents(courseId);
        
        return ApiResponse.<List<PublicCourseStudentResponse>>builder()
                .message("Get course students successfully")
                .result(students)
                .build();
    }

    @GetMapping("/courses/{courseId}/students/{studentId}/quizzes")
    public ApiResponse<List<StudentQuizAttemptResponse>> getStudentQuizAttempts(
            @PathVariable Integer courseId,
            @PathVariable String studentId) {

        List<StudentQuizAttemptResponse> attempts = publicCourseService.getStudentQuizAttempts(courseId, studentId);
        
        return ApiResponse.<List<StudentQuizAttemptResponse>>builder()
                .message("Get student quiz attempts successfully")
                .result(attempts)
                .build();
    }

    @GetMapping("/quizzes/attempts/{attemptId}/details")
    public ApiResponse<QuizAttemptDetailResponse> getQuizAttemptDetails(
            @PathVariable Integer attemptId) {

        QuizAttemptDetailResponse details = publicCourseService.getQuizAttemptDetails(attemptId);
        
        return ApiResponse.<QuizAttemptDetailResponse>builder()
                .message("Get quiz attempt details successfully")
                .result(details)
                .build();
    }

    @GetMapping("/courses/{courseId}/students/{studentId}/assignments")
    public ApiResponse<List<StudentAssignmentSubmissionResponse>> getStudentAssignments(
            @PathVariable Integer courseId,
            @PathVariable String studentId) {

        List<StudentAssignmentSubmissionResponse> submissions = publicCourseService.getStudentAssignments(courseId, studentId);
        
        return ApiResponse.<List<StudentAssignmentSubmissionResponse>>builder()
                .message("Get student assignments successfully")
                .result(submissions)
                .build();
    }

    @PutMapping("/assignments/submissions/{submissionId}/grade")
    public ApiResponse<StudentAssignmentSubmissionResponse> gradeAssignment(
            @PathVariable Integer submissionId,
            @RequestBody GradeAssignmentRequest request) {

        StudentAssignmentSubmissionResponse response = publicCourseService.gradeAssignment(submissionId, request);
        
        return ApiResponse.<StudentAssignmentSubmissionResponse>builder()
                .message("Assignment graded successfully")
                .result(response)
                .build();
    }

    @GetMapping("/statistics/{teacherId}")
    public ApiResponse<TeacherPublicStatisticsResponse> getTeacherStatistics(
            @PathVariable String teacherId) {

        TeacherPublicStatisticsResponse stats = publicCourseService.getTeacherStatistics(teacherId);
        
        return ApiResponse.<TeacherPublicStatisticsResponse>builder()
                .message("Get teacher statistics successfully")
                .result(stats)
                .build();
    }
}
