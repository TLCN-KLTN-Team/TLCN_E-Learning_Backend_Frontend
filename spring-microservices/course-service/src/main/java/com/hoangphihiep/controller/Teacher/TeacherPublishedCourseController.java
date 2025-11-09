package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.PublishCourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.service.PublishedCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/teacher/published-courses")
@RequiredArgsConstructor
@Slf4j
public class TeacherPublishedCourseController {

    private final PublishedCourseService publishedCourseService;

    @PostMapping(value = "/draft", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PublishedCourseResponse> createOrUpdateDraft(
            @RequestPart("data") @Valid PublishCourseRequest request,
            @RequestPart(value = "courseImage", required = false) MultipartFile courseImage,
            @RequestPart(value = "courseVideo", required = false) MultipartFile courseVideo) {

        if (courseImage != null && !courseImage.isEmpty()) {
            log.info("📸 Received courseImage: name = {}, size = {} bytes, type = {}",
                    courseImage.getOriginalFilename(),
                    courseImage.getSize(),
                    courseImage.getContentType());
        } else {
            log.info("❌ No courseImage file received.");
        }

        // ✅ Kiểm tra file courseVideo
        if (courseVideo != null && !courseVideo.isEmpty()) {
            log.info("🎥 Received courseVideo: name = {}, size = {} bytes, type = {}",
                    courseVideo.getOriginalFilename(),
                    courseVideo.getSize(),
                    courseVideo.getContentType());
        } else {
            log.info("❌ No courseVideo file received.");
        }

        log.info("Teacher creating/updating draft published course for course ID: {}", request.getCourseId());


        PublishedCourseResponse response = publishedCourseService.createOrUpdateDraft(request, courseImage, courseVideo);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Draft saved successfully")
                .result(response)
                .build();
    }

    @PostMapping("/{courseId}/submit")
    public ApiResponse<PublishedCourseResponse> submitForApproval(@PathVariable Integer courseId) {
        log.info("Teacher submitting course {} for approval", courseId);
        PublishedCourseResponse response = publishedCourseService.submitForApproval(courseId);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Course submitted for approval successfully")
                .result(response)
                .build();
    }

    @GetMapping
    public ApiResponse<Page<PublishedCourseResponse>> getMyPublishedCourses(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Getting published courses for teacher: {}, status: {}", teacherId, status);

        Page<PublishedCourseResponse> response = publishedCourseService.getPublishedCoursesByTeacher(
                teacherId, status, page, size);

        return ApiResponse.<Page<PublishedCourseResponse>>builder()
                .message("Get published courses successfully")
                .result(response)
                .build();
    }

    @GetMapping("/course/{courseId}")
    public ApiResponse<PublishedCourseResponse> getPublishedCourseByCourseId(@PathVariable Integer courseId) {
        log.info("Getting published course for course ID: {}", courseId);
        PublishedCourseResponse response = publishedCourseService.getPublishedCourseByCourseId(courseId);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Get published course successfully")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<PublishedCourseResponse> getPublishedCourseById(@PathVariable Long id) {
        log.info("Getting published course by ID: {}", id);
        PublishedCourseResponse response = publishedCourseService.getPublishedCourseById(id);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Get published course successfully")
                .result(response)
                .build();
    }

    @GetMapping("/check/{courseId}")
    public ApiResponse<Boolean> checkCoursePublished(@PathVariable Integer courseId) {
        try {
            publishedCourseService.getPublishedCourseByCourseId(courseId);
            return ApiResponse.<Boolean>builder()
                    .message("Course is published")
                    .result(true)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<Boolean>builder()
                    .message("Course is not published")
                    .result(false)
                    .build();
        }
    }
}
