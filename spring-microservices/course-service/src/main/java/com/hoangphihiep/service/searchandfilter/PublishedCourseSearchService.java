package com.hoangphihiep.service.searchandfilter;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.entity.PublishedCourse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

public interface PublishedCourseSearchService {
    void indexAllPublishedCoursesIfNotExists(); // Index all published courses if the Elasticsearch index does not exist
    void index(PublishedCourse course) throws IOException; // Index a new published course into Elasticsearch
    List<PublishedCourseDocument> searchDSLWithFuzzy(String keyword, int page, int size) throws IOException; // Search published courses based on a query string
    List<PublishedCourseDocument> searchCompletionDSL(String keyword, int page, int size) throws IOException;
    List<PublishedCourseDocument> searchDSLWithMultiFilter(String keyword,
                                                           BigDecimal minPrice, BigDecimal maxPrice,
                                                      Integer minRating,
                                                      String category,
                                                      String level,
                                                      String practiceType, String sortBy,
                                                      int page, int size) throws IOException;
    public List<PublishedCourseDocument> searchAll(int size) throws IOException;

}
