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
import java.time.LocalDate;
import java.time.ZoneId;
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
                .instructor(course.getAuthorName())
                .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                .studentsCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                .createdAt(course.getCreatedAt() != null ? 
                        course.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate() : null)
                .updatedAt(course.getUpdatedAt() != null ? 
                        course.getUpdatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate() : null)
                .build();
    }

    private boolean validateStringField(String field) {
        return field != null && !field.trim().isEmpty();
    }

    private boolean validateListField(List<?> field) {
        return field != null && !field.isEmpty();
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

    // Thêm helper method trong service
    private String normalizePracticeType(String value) {
        if (value == null) return null;
        return switch (value.toLowerCase().trim()) {
            case "quiz"          -> "QUIZ";
            case "practice-test" -> "PRACTICE_TEST";
            case "coding"        -> "CODING";
            default              -> null;
        };
    }

    private BoolQuery.Builder buildBoolQueryWhenHaveKeywordAndFilters(SearchFiltersRequest request, boolean hasKeyword) {
        BoolQuery.Builder boolQueryBuilder = QueryBuilders.bool();

        if (hasKeyword) {
            boolQueryBuilder = this.buildBoolQueryOnlyKeyword(request.getKeyword());
        }

        // We don't need checks null or empty because we have already check before pass the prameters
        // Build category filter
        if (this.validateStringField(request.getCategory())) {
            Query categoryFilter = QueryBuilders.term()
                    .field("category.keyword")
                    .value(request.getCategory().trim()) // trim đã có
                    .caseInsensitive(true)  // Bỏ qua hoa/thường
                    .build()._toQuery();
            boolQueryBuilder.filter(categoryFilter);
        }

        // Build rating filter
        if (request.getMinRating() != null) {
            Query ratingFilter = RangeQuery.of(r -> r
                            .field("rating")
                            .gte(JsonData.of(request.getMinRating())))
                    ._toQuery();
            boolQueryBuilder.filter(ratingFilter);
        }

        // Build fee filter
        // Filter fee
        if (this.validateListField(request.getFees())) {
            // FE gửi: ["FREE", "PAID"] hoặc chỉ ["FREE"] hoặc chỉ ["PAID"]
            boolean wantFree = request.getFees().contains("free");
            boolean wantPaid = request.getFees().contains("paid");
            List<FieldValue> feeValues = request.getFees().stream()
                    .map(FieldValue::of)
                    .toList();
            if (wantFree && wantPaid) {
                // Cả hai → không cần filter, bỏ qua
            } else if (wantFree) {
                boolQueryBuilder.filter(QueryBuilders.term()
                        .field("isFree")
                        .value(true)   // ← Boolean true, không phải String "true"
                        .build()._toQuery());
            } else if (wantPaid) {
                boolQueryBuilder.filter(QueryBuilders.term()
                        .field("isFree")
                        .value(false)  // ← Boolean false
                        .build()._toQuery());
            }
        }

        // Build practice type filter
        if (this.validateListField(request.getPracticeTypes())) {
            List<FieldValue> practiceValues = request.getPracticeTypes().stream()
                    .map(this::normalizePracticeType) // ← Normalize giống như khi index
                    .filter(Objects::nonNull)
                    .map(FieldValue::of)
                    .toList();

            if (!practiceValues.isEmpty()) {
                Query practiceFilter = QueryBuilders.terms()
                        .field("practiceTypes")
                        .terms(t -> t.value(practiceValues))
                        .build()._toQuery();
                boolQueryBuilder.filter(practiceFilter);
            }
        }

        return boolQueryBuilder;
    }

    private BoolQuery.Builder buildBoolQueryOnlyKeyword(String keyword) {
        String trimmedKeyword = keyword.trim();
        BoolQuery.Builder keywordBoolQuery = QueryBuilders.bool();

        // Use must-clause for searching items match with keyword
        Query mustMatchPhrase = QueryBuilders.bool()
                .should(QueryBuilders.matchPhrase()
                        .field("courseName").query(trimmedKeyword).build()._toQuery())
                .should(QueryBuilders.matchPhrase()
                        .field("description").query(trimmedKeyword).build()._toQuery())
                .should(QueryBuilders.matchPhrase()
                        .field("category").query(trimmedKeyword).build()._toQuery())
                .minimumShouldMatch("1")  // Ít nhất 1 field phải chứa cả cụm
                .build()._toQuery();
        keywordBoolQuery.must(mustMatchPhrase);

        // SHOULD: Chỉ để tăng điểm, không ảnh hưởng đến việc lọc kết quả để sắp xếp hiển thị tốt hơn
        // Exact match được ưu tiên cao nhất
        keywordBoolQuery.should(QueryBuilders
                .term()
                .field("courseName.keyword")
                .value(trimmedKeyword)
                .boost(10.0f)
                .build()._toQuery());

        // Phrase match ở courseName được ưu tiên cao
        keywordBoolQuery.should(QueryBuilders
                .matchPhrase()
                .field("courseName")
                .query(trimmedKeyword)
                .boost(8.0f)
                .build()._toQuery());

        // Phrase match ở category
        keywordBoolQuery.should(QueryBuilders
                .matchPhrase()
                .field("category")
                .query(trimmedKeyword)
                .boost(6.0f)
                .build()._toQuery());

        // Phrase match ở description
        keywordBoolQuery.should(QueryBuilders
                .matchPhrase()
                .field("description")
                .query(trimmedKeyword)
                .boost(5.0f)
                .build()._toQuery());

        // Match AND ở courseName — tất cả từ phải xuất hiện (không cần liền nhau)
        keywordBoolQuery.should(QueryBuilders
                .match()
                .field("courseName")
                .query(trimmedKeyword)
                .operator(Operator.And)
                .boost(4.0f)
                .build()._toQuery());

        return keywordBoolQuery;
    }

    @Override
    public PaginatedResponse<PublishedCourseCardResponse> searchAndFiltersDSLWithFuzzy(SearchFiltersRequest request) throws IOException {
        log.debug("Starting search with request: {}", request);

        Query finalQuery;
        boolean hasKeyword = request.getKeyword() != null && !request.getKeyword().trim().isEmpty();
        boolean hasFilters = (request.getCategory() != null && !request.getCategory().trim().isEmpty()) ||
                (request.getDurations() != null && !request.getDurations().isEmpty()) ||
                (request.getPracticeTypes() != null && !request.getPracticeTypes().isEmpty()) ||
                (request.getFees() != null && !request.getFees().isEmpty()) ||
                (request.getMinRating() != null);

        if (!hasKeyword && !hasFilters) {
            // No search criteria - return all documents
            finalQuery = QueryBuilders.matchAll().build()._toQuery();
        } else if (hasKeyword && !hasFilters) {
            // Only keyword search without filters
            finalQuery = this.buildBoolQueryOnlyKeyword(request.getKeyword()).build()._toQuery();
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
            // Thêm sort mặc định theo relevance score nếu có keyword
            if (hasKeyword) {
                sortOptions.add(SortOptions.of(s -> s.score(sc -> sc.order(SortOrder.Desc))));
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
        log.debug("Search completed. Total hits: {}, Max score: {}", totalHits, 
                response.hits().maxScore());

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
                        .courseName(course.getCourseName())
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

    /**
     * Autocomplete cho course name
     * GET /api/courses/autocomplete?q=java+spr
     */
    @Override
    public CompletionSuggestionResponse fuzzyAutocompleteSuggestion(String query, int size) throws IOException {
        if (!validateStringParam(query)){
            return CompletionSuggestionResponse.builder()
                    .titleSuggestions(Collections.emptyList())
                    .build();
        }

        return courseCompletionRepository.autoCompletion(query, size);
    }

    private boolean validateStringParam(String param) {
        return param != null && !param.isEmpty();
    }

}
