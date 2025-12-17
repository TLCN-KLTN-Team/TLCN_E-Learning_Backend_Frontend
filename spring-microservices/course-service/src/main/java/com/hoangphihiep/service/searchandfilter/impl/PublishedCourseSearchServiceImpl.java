package com.hoangphihiep.service.searchandfilter.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.json.JsonData;
import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.request.SearchFiltersRequest;
import com.hoangphihiep.dto.response.CompletionSuggestionResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
import com.hoangphihiep.entity.OrderItem;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.helper.Indices;
import com.hoangphihiep.repository.OrderItemRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.elasticsearch.CourseCompletionRepository;
import com.hoangphihiep.service.OrderService;
import com.hoangphihiep.service.ReviewService;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.CurrencyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublishedCourseSearchServiceImpl implements PublishedCourseSearchService {
    private final ElasticsearchClient elasticsearchClient;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final CourseCompletionRepository courseCompletionRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewService reviewService;
    private final OrderService orderService;

    private PublishedCourseDocument toDocument(PublishedCourse course) {
        return PublishedCourseDocument.builder()
                .id(course.getId().toString())
                .courseName(course.getCourse().getCourseName())
                .description(course.getCourse().getDescription())
                .courseIntroduction(course.getCourseIntroduction())
                .price(course.getCoursePrice())
                .category(course.getCourseType().getCourseTypeName())
                .level(null) // TODO: Add level field to PublishedCourse entity if needed
                .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                .studentsCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                .build();
    }

    private boolean validateStringField(String field) {
        return field != null && !field.trim().isEmpty();
    }

    private BoolQuery.Builder buildBoolQueryWhenHaveKeywordAndFilters(SearchFiltersRequest request, boolean hasKeyword) {
        BoolQuery.Builder boolQueryBuilder = QueryBuilders.bool();

        // Add keyword search to must clause if present
        if (hasKeyword) {
            Query multiMatchQuery = QueryBuilders
                    .multiMatch()
                    .query(request.getKeyword().trim())
                    .fields("courseName^3", "description^2", "courseIntroduction")
                    .fuzziness("AUTO")
                    .prefixLength(2)
                    .build()._toQuery();
            boolQueryBuilder.must(multiMatchQuery);
        }

        // Build category filter
        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            List<FieldValue> categoryValues = request.getCategories().stream()
                    .map(FieldValue::of)
                    .collect(Collectors.toList());

            Query categoryFilter = QueryBuilders.terms()
                    .field("category")
                    .terms(t -> t.value(categoryValues))
                    .build()._toQuery();
            boolQueryBuilder.filter(categoryFilter);
        }

        // Build price range filter
        if (request.getMinPrice() != null || request.getMaxPrice() != null) {
            Query priceRangeFilter = Query.of(q -> q
                    .range(r -> {
                        r.field("price");
                        if (request.getMinPrice() != null) {
                            r.gte(JsonData.of(request.getMinPrice().doubleValue()));
                        }
                        if (request.getMaxPrice() != null) {
                            r.lte(JsonData.of(request.getMaxPrice().doubleValue()));
                        }
                        return r;
                    })
            );
            boolQueryBuilder.filter(priceRangeFilter);
        }

        // Build level filter
        if (request.getLevels() != null && !request.getLevels().isEmpty()) {
            List<FieldValue> levelValues = request.getLevels().stream()
                    .map(FieldValue::of)
                    .collect(Collectors.toList());

            Query levelFilter = QueryBuilders.terms()
                    .field("level")
                    .terms(t -> t.value(levelValues))
                    .build()._toQuery();
            boolQueryBuilder.filter(levelFilter);
        }

        // Build rating filter
        if (request.getMinRating() != null) {
            Query ratingFilter = RangeQuery.of(r -> r
                            .field("rating")
                            .gte(JsonData.of(request.getMinRating().doubleValue())))
                    ._toQuery();
            boolQueryBuilder.filter(ratingFilter);
        }
        return boolQueryBuilder;
    }

    private List<SortOptions> buildSortOptions(String sortBy) {
        List<SortOptions> sortOptions = new ArrayList<>();
        if (sortBy != null && !sortBy.isEmpty()) {
            switch (sortBy) {
                case "price_asc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("price").order(SortOrder.Asc))
                ));
                case "price_desc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("price").order(SortOrder.Desc))
                ));
                case "rating" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("rating").order(SortOrder.Desc))
                ));
                case "newest" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("createdAt").order(SortOrder.Desc))
                ));
//                case "popular" -> sortOptions.add(SortOptions.of(s -> s
//                        .field(f -> f.field("").order(SortOrder.Desc))
//                ));
                default -> {
                    // No sorting applied
                }
            }
        }
        return sortOptions;
    }

    @Override
    public PaginatedResponse<PublishedCourseCardResponse> searchAndFiltersDSLWithFuzzy(SearchFiltersRequest request) throws IOException {
        log.debug("Starting search with request: {}", request);

        Query finalQuery;
        boolean hasKeyword = request.getKeyword() != null && !request.getKeyword().trim().isEmpty();
        boolean hasFilters = (request.getCategories() != null && !request.getCategories().isEmpty()) ||
                (request.getMinPrice() != null || request.getMaxPrice() != null) ||
                (request.getLevels() != null && !request.getLevels().isEmpty()) ||
                (request.getMinRating() != null);

        if (!hasKeyword && !hasFilters) {
            // No search criteria - return all documents
            finalQuery = QueryBuilders.matchAll().build()._toQuery();
        } else if (hasKeyword && !hasFilters) {
            // Only keyword search - no need for bool query
            finalQuery = QueryBuilders
                    .multiMatch()
                    .query(request.getKeyword().trim())
                    .fields("courseName^3", "description^2", "courseIntroduction")
                    .fuzziness("AUTO")
                    .prefixLength(2)
                    .build()._toQuery();
        } else {
            // Build bool query with filters and optional keyword
            BoolQuery.Builder boolQueryBuilder = this.buildBoolQueryWhenHaveKeywordAndFilters(request, hasKeyword);

            finalQuery = boolQueryBuilder.build()._toQuery();
        }

        // Build sort options
        List<SortOptions> sortOptions;
        if (request.getSortBy() != null && !request.getSortBy().isEmpty()) {
            sortOptions = this.buildSortOptions(request.getSortBy());
        } else {
            sortOptions = new ArrayList<>();
        }

        // Build search request with pagination
        int from = request.getPage() * request.getSize();
        SearchRequest searchRequest = SearchRequest.of(sr -> {
            var builder = sr
                    .index(Indices.PUBLISHED_COURSE_INDEX)
                    .query(finalQuery)
                    .from(from)
                    .size(request.getSize())
                    .trackTotalHits(th -> th.enabled(true));

            if (!sortOptions.isEmpty()) {
                builder.sort(sortOptions);
            }

            return builder;
        });

        // Execute search
        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(
                searchRequest,
                PublishedCourseDocument.class
        );

        assert response.hits().total() != null;
        long totalHits = response.hits().total().value();
        int totalPages = (int) Math.ceil((double) totalHits / request.getSize());
        log.debug("Search completed. Total hits: {}", response.hits().total().value());

        List<PublishedCourse> publishedCourses = response.hits().hits()
                .stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(doc -> publishedCourseRepository.findById(Integer.parseInt(doc.getId())).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        // Convert hits to response objects
        List<PublishedCourseCardResponse> result = publishedCourses.stream()
                .map(course -> PublishedCourseCardResponse.builder()
                        .id(course.getId())
                        .courseName(course.getCourse().getCourseName())
                        .coursePrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .amountPrice(course.getCoursePrice())
                        .authorName(course.getAuthorName())
                        .thumbnailUrl(course.getCourseImage())
                        .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                        .reviewCount(course.getReview().size())
                        .studentCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                        .category(course.getCourseType().getCourseTypeName())
                        .build())
                .toList();

        return PaginatedResponse.<PublishedCourseCardResponse>builder()
                .content(result)
                .page(request.getPage())
                .size(request.getSize())
                .totalElements(totalHits)
                .totalPages(totalPages)
                .build();
    }

    private PublishedCourseCardResponse convertToCardResponse(PublishedCourse entity) {
        return PublishedCourseCardResponse.builder()
                .id(entity.getId())
                .courseName(entity.getCourse().getCourseName())
                .category(entity.getCourseType().getCourseTypeName())
                .coursePrice(currencyUtils.formatCurrency(entity.getCoursePrice()))
                .build();
    }

    /**
     * Autocomplete cho course name
     * GET /api/courses/autocomplete?q=java+spr
     */
    @Override
    public CompletionSuggestionResponse autocompleteSuggestion(String query, int size) throws IOException {
        if (!validateStringParam(query)){
            return CompletionSuggestionResponse.builder()
                    .titleSuggestions(Collections.emptyList())
                    .build();
        }

        return courseCompletionRepository.autoCompletion(query);
    }

    private boolean validateStringParam(String param) {
        return param != null && !param.isEmpty();
    }

}
