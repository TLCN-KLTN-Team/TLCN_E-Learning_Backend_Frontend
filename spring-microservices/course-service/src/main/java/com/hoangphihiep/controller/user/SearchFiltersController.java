package com.hoangphihiep.controller.user;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.request.SearchFiltersRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/search-filters")
@RequiredArgsConstructor
public class SearchFiltersController {
    private final PublishedCourseSearchService publishedCourseSearchService;

    @PostMapping("/index-all")
    public String indexAllCourses() throws IOException {
        publishedCourseSearchService.bulkIndexCoursesIfNotExists();
        return "Indexed all courses successfully !";
    }

    @GetMapping("/search")
    public ApiResponse<?> searchPublishedCourses(@RequestParam (defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice,
                                                 @RequestParam(required = false) Integer minRating,
                                                 @RequestParam(required = false) List<String> levels,
                                                 @RequestParam(required = false) String practiceType,
                                                 @RequestParam(required = false) List<String> categories,
                                                 @RequestParam(defaultValue = "relevance") String sortBy
    ) throws IOException {
        // builde request
        SearchFiltersRequest request = SearchFiltersRequest.builder()
                .keyword(keyword == null ? "" : keyword)
                .categories(categories)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .levels(levels)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .build();
        // extra elastic search when implementing
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
