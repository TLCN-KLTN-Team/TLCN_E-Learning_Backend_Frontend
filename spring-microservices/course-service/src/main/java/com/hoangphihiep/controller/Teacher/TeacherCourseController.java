package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.BulkSectionRequest;
import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.service.CourseService;
import com.hoangphihiep.service.SectionService;
import com.hoangphihiep.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
@RequiredArgsConstructor
@Slf4j
public class TeacherCourseController {

    private final CourseService courseService;

    private final SectionService sectionService;

    private final TeacherService teacherService;
    @GetMapping("/{teacherId}")
    public ApiResponse<List<CourseResponse>> getCoursesByTeacher(
            @PathVariable String teacherId) {

        List<CourseResponse> courses = courseService.getCoursesByTeacherWithDetails(teacherId);

        return ApiResponse.<List<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/{teacherId}/paginated")
    public ApiResponse<Page<CourseResponse>> getCoursesByTeacherPaginated(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Getting paginated courses for teacher: {}", teacherId);

        // Get courses
        Page<CourseResponse> courses = courseService.getCoursesByTeacherPaginated(teacherId, page, size);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/section/{courseId}")
    public ApiResponse<List<SectionResponse>> getCourseDetail(
            @PathVariable Integer courseId) {

        List<SectionResponse> sectionResponse = sectionService.getSectionsByCourseId(courseId);

        return ApiResponse.<List<SectionResponse>>builder()
                .result(sectionResponse)
                .build();
    }

    @PostMapping("/section/create")
    public ApiResponse<List<SectionResponse>> createSections(@Valid @RequestBody BulkSectionRequest request) {
        List<SectionResponse> responses = sectionService.createSections(request);

        return ApiResponse.<List<SectionResponse>>builder()
                .result(responses)
                .build();
    }
}
