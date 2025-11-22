package com.hoangphihiep.controller.user;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
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

    // load courses published paging
    @GetMapping
    public ApiResponse<PaginatedResponse<?>> getPublishedCourses(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<PublishedCourseCardResponse> response = publishedCourseService.getPublishedCoursesWithPaging(
                page,
                size
        );

        return ApiResponse.success(
                response,
                "Load published courses successfully"
        );
    }

    // get bought courses
    @GetMapping("/my-courses")
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

    // load courses published filtered and paged
//    @PostMapping("/index")
//    public String indexCourse() throws IOException {
//        publishedCourseSearchService.index();
//        return "Indexed course ";
//    }

}