package com.hoangphihiep.controller;

import com.hoangphihiep.dto.request.SearchFiltersRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.UserPublishedCourseService;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.ElasticSearchIndexInitializer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/published-courses")
@RequiredArgsConstructor
public class PublicCourseController {
    private final UserPublishedCourseService userPublishedCourseService;
    private final PublishedCourseSearchService publishedCourseSearchService;
    private final ElasticSearchIndexInitializer elasticSearchIndexInitializer;

    // some apis get data here
    // get courses suggest for user
    // get courses by favorite based on user behavior
    // we need to integrated ai

    // get educational units which joined our system

    // get positive review from user


    @GetMapping("/{courseId}")
    public ApiResponse<?> getPublishedCourseById(@PathVariable Integer courseId) {
        var response = userPublishedCourseService.getPublishedCourseDetailById(courseId);
        return ApiResponse.success(
                response,
                "Load published course by " + courseId +  " successfully"
        );
    }

    @GetMapping("/search")
    public ApiResponse<?> searchAndFiltersPublishedCourses(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice,
                                                 @RequestParam(required = false) Double minRating,
                                                 @RequestParam(required = false) List<String> levels,
                                                 @RequestParam(required = false) String practiceType,
                                                 @RequestParam(required = false) List<String> categories,
                                                 @RequestParam(defaultValue = "popular") String sort
    ) throws IOException {
        // builde request
        SearchFiltersRequest request = SearchFiltersRequest.builder()
                .keyword(keyword == null ? "" : keyword)
                .categories(categories)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .requiredPractice(practiceType)
                .levels(levels)
                .page(page)
                .size(size)
                .sortBy(sort)
                .build();
        // extra elastic search when implementing
        //
        elasticSearchIndexInitializer.bulkIndexCoursesIfNotExists();
        //
        var result = publishedCourseSearchService.searchAndFiltersDSLWithFuzzy(request);
        return ApiResponse.success(
                result,
                "Search published courses successfully"
        );
    }

    @GetMapping("/auto-completion")
    public ApiResponse<?> completionSearchForPublishedCourses(@RequestParam("q") String query,
                                                              @RequestParam( defaultValue = "10") int size) throws IOException {
        var result = publishedCourseSearchService.autocompleteSuggestion(query, size);
        return ApiResponse.success(
                result,
                "Completion search published courses successfully"
        );
    }

}
