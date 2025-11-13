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
@RequestMapping("/published-courses")
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

    @GetMapping("/{courseId}")
    public ApiResponse<?> getPublishedCourseById(@PathVariable Integer courseId) {
        var response = publishedCourseService.getPublishedCourseDetailById(courseId);
        return ApiResponse.success(
                response,
                "Load published course successfully"
        );
    }

    // load courses published filtered and paged
//    @PostMapping("/index")
//    public String indexCourse() throws IOException {
//        publishedCourseSearchService.index();
//        return "Indexed course ";
//    }

    @PostMapping("/index-all")
    public String indexAllCourses() throws IOException {
        publishedCourseSearchService.indexAllPublishedCoursesIfNotExists();
        return "Indexed all courses successfully !";
    }

    @GetMapping("/all")
    public List<PublishedCourseDocument> getAll(@RequestParam(defaultValue = "10") int size) throws IOException {
        return publishedCourseSearchService.searchAll(size);
    }

    @GetMapping("/search")
    public ApiResponse<?> searchPublishedCourses(@RequestParam (defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(required = false) String keyword) throws IOException {
        // extra elastic search when implementing
        var result = publishedCourseSearchService.searchDSLWithFuzzy(
                keyword == null ? "" : keyword,
                page,
                size
        );
        return ApiResponse.success(
                result,
                "Search published courses successfully"
        );
    }

    @GetMapping("/completion-search")
    public ApiResponse<?> completionSearchForPublishedCourses(@RequestParam String keyword,
                                                              @RequestParam( defaultValue = "0") int page,
                                                                @RequestParam( defaultValue = "10") int size) throws IOException {
        var result = publishedCourseSearchService.searchCompletionDSL(keyword, page, size);
        return ApiResponse.success(
                result,
                "Completion search published courses successfully"
        );
    }

    @GetMapping("/filter")
    public ApiResponse<?> filterPublishedCourses(@RequestParam (defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(required = false) String query,
                                                @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice,
                                                @RequestParam(required = false) Integer minRating,
                                                @RequestParam(required = false) String level,
                                                @RequestParam(required = false) String practiceType,
                                                @RequestParam(required = false) String category,
                                                 @RequestParam(required = false) String sortBy
                                                ) throws IOException {
        var result = publishedCourseSearchService.searchDSLWithMultiFilter(
                query == null ? "" : query,
                minPrice,
                maxPrice,
                minRating,
                level,
                practiceType,
                category,
                sortBy,
                page,
                size
        );

        return ApiResponse.success(
                result,
                "Filter published courses successfully"
        );
    }

}