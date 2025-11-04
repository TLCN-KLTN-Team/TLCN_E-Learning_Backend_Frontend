package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EnrolledCoursesResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.service.CourseEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/course-enrollments")
@RequiredArgsConstructor
public class StudentCourseController {
    private final CourseEnrollmentService enrollmentService;

    // get all paging courses
    @GetMapping("/catalog")
    public ApiResponse<PaginatedResponse<?>> getCatalogCourses(@RequestParam int page,
                                                              @RequestParam int size,
                                                              @RequestParam(required = false) String search) {
        PaginatedResponse<EnrolledCoursesResponse> courses = enrollmentService.getEnrolledCatalogCourses(page, size);
        return ApiResponse.<PaginatedResponse<?>>builder()
                .result(courses)
                .build();
    }

    // get contents
    @GetMapping("/class/{classId}/contents")
    public ApiResponse<?> getEnrolledCourseContents(@PathVariable Long classId) {
        var contents = enrollmentService.getEnrolledCourseContentByClassId(classId);
        return ApiResponse.success(
                contents,
                "Get enrolled course contents successfully"
        );
    }

    // get personal assignments

    // get group assignments

    // get quizzes

    // get scores and feedback
}
