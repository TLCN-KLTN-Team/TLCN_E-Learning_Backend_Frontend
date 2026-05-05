package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.CourseClassService;
import com.hoangphihiep.service.CourseEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student/course-enrollments")
@RequiredArgsConstructor
public class StudentCourseController {

    private final CourseEnrollmentService enrollmentService;
    private final CourseClassService classService;

    @GetMapping("/catalog")
    public ApiResponse<PaginatedResponse<?>> getCatalogCourses(@RequestParam int page,
                                                              @RequestParam int size,
                                                              @RequestParam(required = false) String search,
                                                              @RequestParam(required = false, defaultValue = "course_name") String sortBy) {
        PaginatedResponse<EnrolledCoursesResponse> courses = enrollmentService.getEnrolledCatalogCourses(page, size, search, sortBy);
        return ApiResponse.<PaginatedResponse<?>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/class/{classId}/contents")
    public ApiResponse<?> getEnrolledCourseContents(@PathVariable Integer classId) {
        var contents = enrollmentService.getEnrolledCourseContentByClassIdStrict(classId);
        return ApiResponse.<List<SectionResponse>>builder()
                .result(contents)
                .build();
    }

    @GetMapping("/class/{classId}")
    public ApiResponse<CourseClassResponse> getClassesById(
            @PathVariable Integer classId) {

        CourseClassResponse classes = classService.getClassesById(classId);

        return ApiResponse.<CourseClassResponse>builder()
                .result(classes)
                .build();
    }
}
