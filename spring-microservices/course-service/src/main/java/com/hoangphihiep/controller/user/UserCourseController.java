package com.hoangphihiep.controller.user;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.PublishedCourseTeacherService;
import com.hoangphihiep.service.SectionService;
import com.hoangphihiep.service.UserPublishedCourseService;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/user/published-courses")
@RequiredArgsConstructor
public class UserCourseController {
    private final UserPublishedCourseService publishedCourseService;
    private final PublishedCourseSearchService publishedCourseSearchService;
    private final PublishedCourseTeacherService publishedCourseTeacherService;

    // get bought courses
    @GetMapping("/purchased")
    public ApiResponse<?> getBoughtCourses() {
        var response = publishedCourseService.getMyPublishedCourse();
        return ApiResponse.success(
                response,
                "Load bought courses successfully"
        );
    }

    @GetMapping("/pending-orders")
    public ApiResponse<?> getPendingOrders() {
        var response = publishedCourseService.getPendingOrders();
        return ApiResponse.success(
                response,
                "Load pending orders successfully"
        );
    }

    @GetMapping("/section/{courseId}")
    public ApiResponse<List<SectionResponse>> getCourseDetail(
            @PathVariable Integer courseId) {

        PublishedCourseResponse response = publishedCourseTeacherService.getPublishedCourseById(courseId);

        List<SectionResponse> sectionResponse = response.getPublishedSections();

        return ApiResponse.<List<SectionResponse>>builder()
                .result(sectionResponse)
                .build();
    }

    // load courses published filtered and paged
//    @PostMapping("/index")
//    public String indexCourse() throws IOException {
//        publishedCourseSearchService.index();
//        return "Indexed course ";
//    }

}