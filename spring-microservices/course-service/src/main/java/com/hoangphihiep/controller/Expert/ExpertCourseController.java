package com.hoangphihiep.controller.Expert;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expert/educational-unit/{educationalUnitId}")
@RequiredArgsConstructor
@Slf4j
public class ExpertCourseController {

    private final CourseService expertCourseService;
    @GetMapping("/courses")
    public ApiResponse<Page<CourseResponse>> getCoursesByEducationalUnitId(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        // Get current expert ID from context
        String expertId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching courses for expert ID: {} in unit {}", expertId, educationalUnitId);

        Page<CourseResponse> courses = expertCourseService.getCoursesByExpertId(expertId, page, size, search);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @PostMapping("/courses")
    public ApiResponse<CourseResponse> createCourse(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody CourseRequest request) {

        CourseResponse response = expertCourseService.createCourseForEducationalUnit(educationalUnitId, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}")
    public ApiResponse<CourseResponse> updateCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId,
            @Valid @RequestBody CourseRequest request) {

        CourseResponse response = expertCourseService.updateCourseForEducationalUnit(educationalUnitId, courseId, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/assign-teacher")
    public ApiResponse<CourseResponse> assignTeacherToCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId,
            @RequestParam String teacherId) {

        try {
            CourseResponse response = expertCourseService.assignTeacherToCourse(courseId, teacherId);

            return ApiResponse.<CourseResponse>builder()
                    .result(response)
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (JsonProcessingException je) {
            throw new AppException(ErrorCode.JSON_PROCESSING_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error during assignTeacherToCourse", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @PutMapping("/courses/{courseId}/remove-teacher")
    public ApiResponse<CourseResponse> removeTeacherFromCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId) {

        CourseResponse response = expertCourseService.removeTeacherFromCourse(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }
}
