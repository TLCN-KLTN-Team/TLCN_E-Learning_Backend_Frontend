package com.hoangphihiep.service.searchandfilter;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.request.SearchFiltersRequest;
import com.hoangphihiep.dto.response.CompletionSuggestionResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
import com.hoangphihiep.entity.PublishedCourse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

public interface PublishedCourseSearchService {
    // Search published courses based on a query string
    PaginatedResponse<PublishedCourseCardResponse> searchAndFiltersDSLWithFuzzy(SearchFiltersRequest request) throws IOException;
    CompletionSuggestionResponse fuzzyAutocompleteSuggestion(String prefix, int size) throws IOException;

}
