package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseObjectiveResponse;
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

        List<CourseObjectiveResponse> responses = courseObjectiveService.getActiveCourseObjectivesByTeacherId();

        return ApiResponse.<List<CourseObjectiveResponse>>builder()
                .result(responses)
                .build();
    }
}
