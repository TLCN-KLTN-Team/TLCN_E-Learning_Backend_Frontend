package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teachers")
@RequiredArgsConstructor
@Slf4j
public class TeacherController {

    private final TeacherService teacherService;
    @PostMapping
    public ApiResponse<TeacherResponse> createTeacher(@Valid @RequestBody TeacherRequest request) {
        return ApiResponse.<TeacherResponse>builder()
                .code(1000)
                .message("Create teacher successfully")
                .result(teacherService.createTeacher(request))
                .build();
    }

}

