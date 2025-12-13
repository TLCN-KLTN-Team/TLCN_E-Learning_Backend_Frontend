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

    private PublishedCourseDocument toDocument(PublishedCourse course) {
        return PublishedCourseDocument.builder()
                .id(course.getId().toString())
                .courseName(course.getCourse().getCourseName())
                .description(course.getCourse().getDescription())
                .price(course.getCoursePrice())
                .category(course.getCourseType().getCourseTypeName())
                .build();
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
                    .fields("courseName^2", "description")
                    .fuzziness("AUTO")
                    .prefixLength(2)
                    .build()._toQuery();
        } else {
            // Build bool query with filters and optional keyword
            BoolQuery.Builder boolQueryBuilder = QueryBuilders.bool();

            // Add keyword search to must clause if present
            if (hasKeyword) {
                Query multiMatchQuery = QueryBuilders
                        .multiMatch()
                        .query(request.getKeyword().trim())
                        .fields("courseName^2", "description")
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

            finalQuery = boolQueryBuilder.build()._toQuery();
        }

        // Build sort options
        List<SortOptions> sortOptions = new ArrayList<>();
        if (request.getSortBy() != null && !request.getSortBy().isEmpty()) {
            switch (request.getSortBy()) {
                case "price_asc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("price").order(SortOrder.Asc))
                ));
                case "price_desc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("price").order(SortOrder.Desc))
                ));
                case "rating_desc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("rating").order(SortOrder.Desc))
                ));
                case "students_desc" -> sortOptions.add(SortOptions.of(s -> s
                        .field(f -> f.field("studentsCount").order(SortOrder.Desc))
                ));
                default -> log.warn("Unknown sort option: {}", request.getSortBy());
            }
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
        List<OrderItem> orderItems = orderItemRepository.findAll();
        List<PublishedCourseCardResponse> result = publishedCourses.stream()
                .map(this::convertToCardResponse)
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

//    @Override
//    public List<PublishedCourseDocument> searchDSLWithMultiFilter(String keyword,
//                                                                  BigDecimal minPrice, BigDecimal maxPrice,
//                                                                  Integer minRating,
//                                                                  String category, String level,
//                                                                  String practiceType, String sortBy,
//                                                                  int page, int size) throws IOException {
//        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();
//
//        // Add must clause for keyword search
//        if (this.validateStringParam(keyword)) {
//            Query mustClause = MultiMatchQuery.of(m -> m
//                    .query(keyword)
//                    .fields("courseName^3", "description^2")
//                    .fuzziness("AUTO")
//            )._toQuery();
//            boolQueryBuilder.must(mustClause);
//        }
//
//        // Add filter clauses based on provided filters
//        // category criteria
//        if (this.validateStringParam(level)) {
//            Query levelFilter = TermQuery.of(tq -> tq
//                    .field("level")
//                    .value(level)
//            )._toQuery();
//            boolQueryBuilder.filter(levelFilter);
//        }
//        if (this.validateStringParam(category)) {
//            Query categoryFilter = TermQuery.of(tq -> tq
//                    .field("category")
//                    .value(category)
//            )._toQuery();
//            boolQueryBuilder.filter(categoryFilter);
//        }
//        if (this.validateStringParam(practiceType)) {
//            Query practiceTypeFilter = TermQuery.of(tq -> tq
//                    .field("practiceType")
//                    .value(practiceType)
//            )._toQuery();
//            boolQueryBuilder.filter(practiceTypeFilter);
//        }
//
//        // price range criteria
//        if (minPrice!= null || maxPrice != null) {
//            Query priceRangeQuery = NumberRangeQuery.of(r -> {
//                var query = r.field("price");
//                if (minPrice!= null) {
//                    query.gte(Double.parseDouble(minPrice.toString()));
//                }
//                if (maxPrice!= null) {
//                    query.gte(Double.parseDouble(maxPrice.toString()));
//                }
//                return query;
//            })._toRangeQuery()._toQuery();
//            boolQueryBuilder.filter(priceRangeQuery);
//        }
//
//        // build final query
//        Query finalQuery = boolQueryBuilder.build()._toQuery();
//        // build sort criteria
//        List<SortOptions> sortOptions = switch (sortBy) {
//            case "price_asc" -> List.of(SortOptions.of(s -> s
//                    .field(f -> f
//                            .field("price")
//                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Asc)
//                    )
//            ));
//            case "price_desc" -> List.of(SortOptions.of(s -> s
//                    .field(f -> f
//                            .field("price")
//                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
//                    )
//            ));
//            case "rating_desc" -> List.of(SortOptions.of(s -> s
//                    .field(f -> f
//                            .field("rating")
//                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
//                    )
//            ));
//            case "students_desc" -> List.of(SortOptions.of(s -> s
//                    .field(f -> f
//                            .field("studentsCount")
//                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
//                    )
//            ));
//            default -> List.of(); // no sorting
//        };
//
//        // build search request
//        SearchRequest request = SearchRequest.of(s -> s
//                .index(Indices.PUBLISHED_COURSE_INDEX)
//                .query(finalQuery)
//                .from(page * size)
//                .size(size)
//                .sort(sortOptions)
//        );
//
//        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(
//                request,
//                PublishedCourseDocument.class
//        );
//
//        return response.hits().hits().stream()
//                .map(Hit::source)
//                .toList();
//    }


}
