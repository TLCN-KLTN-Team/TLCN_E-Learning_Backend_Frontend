package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseObjectiveResponse;
import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.service.CourseObjectiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/teacher/clos")
@RequiredArgsConstructor
@Slf4j
public class TeacherCourseObjectiveController {

    private final CourseObjectiveService courseObjectiveService;

    @GetMapping
    public ApiResponse<List<CourseObjectiveResponse>> getTeacherActiveClos() {
        String teacherId = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        List<CourseObjective> clos = courseObjectiveService.getActiveCourseObjectivesByTeacherId(teacherId);

        List<CourseObjectiveResponse> responses = clos.stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.<List<CourseObjectiveResponse>>builder()
                .result(responses)
                .build();
    }

    private CourseObjectiveResponse toResponse(CourseObjective objective) {
        return CourseObjectiveResponse.builder()
                .id(objective.getId())
                .courseId(objective.getCourse().getId())
                                .courseName(objective.getCourse().getCourseName())
                .code(objective.getCode())
                .description(objective.getDescription())
                .isActive(objective.getIsActive())
                .createdAt(objective.getCreatedAt())
                .updatedAt(objective.getUpdatedAt())
                .build();
    }
}
