package com.hoangphihiep.controller;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.TeacherCourseResponse;
import com.hoangphihiep.dto.response.TeacherDetailResponse;
import com.hoangphihiep.service.TeacherPublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/anonymous/teachers")
@RequiredArgsConstructor
public class PublicTeacherController {
    private final TeacherPublicService teacherPublicService;

    @GetMapping("/{teacherId}")
    public ApiResponse<TeacherDetailResponse> getTeacherDetail(@PathVariable String teacherId) {
        
        TeacherDetailResponse teacher = teacherPublicService.getTeacherDetail(teacherId);
        
        return ApiResponse.success(teacher, "Get teacher detail successfully");
    }

    @GetMapping("/{teacherId}/published-courses")
    public ApiResponse<PaginatedResponse<TeacherCourseResponse>> getTeacherCourses(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        PaginatedResponse<TeacherCourseResponse> courses = 
                teacherPublicService.getTeacherCourses(teacherId, pageable);
        
        return ApiResponse.success(courses, "Get teacher courses successfully");
    }
}
