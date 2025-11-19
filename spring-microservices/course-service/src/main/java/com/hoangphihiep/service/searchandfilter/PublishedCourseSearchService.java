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
    void bulkIndexCoursesIfNotExists(); // Index all published courses if the Elasticsearch index does not exist
    void indexCourse(PublishedCourse course) throws IOException; // Index a new published course into Elasticsearch
    PaginatedResponse<PublishedCourseCardResponse> searchAndFiltersDSLWithFuzzy(SearchFiltersRequest request) throws IOException; // Search published courses based on a query string
    CompletionSuggestionResponse autocompleteSuggestion(String prefix, int size) throws IOException;

}
