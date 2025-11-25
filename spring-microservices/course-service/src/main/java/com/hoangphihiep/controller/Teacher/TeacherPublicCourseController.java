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

    /**
     * Lấy danh sách khóa học public của teacher (có phí)
     */
    @GetMapping("/courses/{teacherId}")
    public ApiResponse<Page<PublicCourseResponse>> getPublicCourses(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Getting public courses for teacher: {}", teacherId);
        Page<PublicCourseResponse> courses = publicCourseService.getPublicCoursesByTeacher(teacherId, page, size);
        
        return ApiResponse.<Page<PublicCourseResponse>>builder()
                .message("Get public courses successfully")
                .result(courses)
                .build();
    }

    /**
     * Lấy danh sách học viên của một khóa học public
     */
    @GetMapping("/courses/{courseId}/students")
    public ApiResponse<List<PublicCourseStudentResponse>> getCourseStudents(
            @PathVariable Integer courseId) {
        
        log.info("Getting students for public course: {}", courseId);
        List<PublicCourseStudentResponse> students = publicCourseService.getCourseStudents(courseId);
        
        return ApiResponse.<List<PublicCourseStudentResponse>>builder()
                .message("Get course students successfully")
                .result(students)
                .build();
    }

    /**
     * Lấy danh sách các lần làm quiz của một học viên
     */
    @GetMapping("/courses/{courseId}/students/{studentId}/quizzes")
    public ApiResponse<List<StudentQuizAttemptResponse>> getStudentQuizAttempts(
            @PathVariable Integer courseId,
            @PathVariable String studentId) {
        
        log.info("Getting quiz attempts for student {} in course {}", studentId, courseId);
        List<StudentQuizAttemptResponse> attempts = publicCourseService.getStudentQuizAttempts(courseId, studentId);
        
        return ApiResponse.<List<StudentQuizAttemptResponse>>builder()
                .message("Get student quiz attempts successfully")
                .result(attempts)
                .build();
    }

    /**
     * Lấy chi tiết một lần làm quiz
     */
    @GetMapping("/quizzes/attempts/{attemptId}/details")
    public ApiResponse<QuizAttemptDetailResponse> getQuizAttemptDetails(
            @PathVariable Integer attemptId) {
        
        log.info("Getting quiz attempt details: {}", attemptId);
        QuizAttemptDetailResponse details = publicCourseService.getQuizAttemptDetails(attemptId);
        
        return ApiResponse.<QuizAttemptDetailResponse>builder()
                .message("Get quiz attempt details successfully")
                .result(details)
                .build();
    }

    /**
     * Lấy danh sách bài tập đã nộp của một học viên
     */
    @GetMapping("/courses/{courseId}/students/{studentId}/assignments")
    public ApiResponse<List<StudentAssignmentSubmissionResponse>> getStudentAssignments(
            @PathVariable Integer courseId,
            @PathVariable String studentId) {
        
        log.info("Getting assignment submissions for student {} in course {}", studentId, courseId);
        List<StudentAssignmentSubmissionResponse> submissions = publicCourseService.getStudentAssignments(courseId, studentId);
        
        return ApiResponse.<List<StudentAssignmentSubmissionResponse>>builder()
                .message("Get student assignments successfully")
                .result(submissions)
                .build();
    }

    /**
     * Chấm điểm bài tập
     */
    @PutMapping("/assignments/submissions/{submissionId}/grade")
    public ApiResponse<StudentAssignmentSubmissionResponse> gradeAssignment(
            @PathVariable Integer submissionId,
            @RequestBody GradeAssignmentRequest request) {
        
        log.info("Grading assignment submission: {}", submissionId);
        StudentAssignmentSubmissionResponse response = publicCourseService.gradeAssignment(submissionId, request);
        
        return ApiResponse.<StudentAssignmentSubmissionResponse>builder()
                .message("Assignment graded successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy thống kê tổng quan của teacher về khóa học public
     */
    @GetMapping("/statistics/{teacherId}")
    public ApiResponse<TeacherPublicStatisticsResponse> getTeacherStatistics(
            @PathVariable String teacherId) {
        
        log.info("Getting public course statistics for teacher: {}", teacherId);
        TeacherPublicStatisticsResponse stats = publicCourseService.getTeacherStatistics(teacherId);
        
        return ApiResponse.<TeacherPublicStatisticsResponse>builder()
                .message("Get teacher statistics successfully")
                .result(stats)
                .build();
    }
}
