package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    CourseService courseService;
    @GetMapping("/teachers/{teacherId}/courses")
    public ApiResponse<List<CourseResponse>> getCoursesByTeacher(
            @PathVariable String teacherId) {

        List<CourseResponse> courses = courseService.getCoursesByTeacherWithDetails(teacherId);

        return ApiResponse.<List<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/teachers/{teacherId}/courses/paginated")
    public ApiResponse<Page<CourseResponse>> getCoursesByTeacherPaginated(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<CourseResponse> courses = courseService.getCoursesByTeacherPaginated(teacherId, page, size);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }
}
