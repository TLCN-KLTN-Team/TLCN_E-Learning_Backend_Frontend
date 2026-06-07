package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.GroupAssignmentResponse;
import com.hoangphihiep.service.GroupAssignmentQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student/group-assignments")
@RequiredArgsConstructor
public class StudentGroupAssignmentController {

    private final GroupAssignmentQueryService service;

    @GetMapping("/class/{classId}")
    public ApiResponse<List<GroupAssignmentResponse>> getMyGroupAssignments(@PathVariable Integer classId) {
        return ApiResponse.<List<GroupAssignmentResponse>>builder()
                .result(service.getMyGroupAssignments(classId))
                .build();
    }
}
