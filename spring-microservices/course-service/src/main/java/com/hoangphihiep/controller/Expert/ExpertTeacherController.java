package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expert/educational-unit/{educationalUnitId}/teachers")
@RequiredArgsConstructor
@Slf4j
public class ExpertTeacherController {

    private final CourseService courseService;

    @GetMapping
    public ApiResponse<Page<TeacherResponse>> getTeachersByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Page<TeacherResponse> teachers = courseService.getTeachersForExpert(educationalUnitId, page, size, search);

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teachers)
                .build();
    }
}
