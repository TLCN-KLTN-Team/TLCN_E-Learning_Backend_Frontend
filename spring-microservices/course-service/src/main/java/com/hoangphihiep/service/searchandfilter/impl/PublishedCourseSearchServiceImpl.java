package com.hoangphihiep.service.searchandfilter.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.helper.Indices;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.tdigest.Sort;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublishedCourseSearchServiceImpl implements PublishedCourseSearchService {
    private final ElasticsearchOperations operations;
    private final ElasticsearchClient elasticsearchClient;
    private final PublishedCourseRepository publishedCourseRepository;
    private RangeQuery.Builder r;

    @Override
    public void indexAllPublishedCoursesIfNotExists() {
        List<PublishedCourse> publishedCourses = publishedCourseRepository.findAll();
        for (PublishedCourse course : publishedCourses) {
            try {
                this.index(course);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Override
    public void index(PublishedCourse course) throws IOException {
        PublishedCourseDocument document = this.toDocument(course);
        elasticsearchClient.index(req -> req
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .id(document.getId())
                .document(document)
        );
    }

    private PublishedCourseDocument toDocument(PublishedCourse course) {
        return PublishedCourseDocument.builder()
                .id(course.getId().toString())
                .courseName(course.getCourse().getCourseName())
                .description(course.getCourse().getDescription())
                .price(course.getCoursePrice())
                .category(course.getCourseType().getCourseTypeName())
                .build();
    }

    /** 4️⃣ Search all documents */
    @Override
    public List<PublishedCourseDocument> searchAll(int size) throws IOException {
        SearchRequest request = SearchRequest.of(s -> s
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .query(q -> q.matchAll(m -> m))
                .size(size)
        );

        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(request, PublishedCourseDocument.class);

        return response.hits().hits().stream()
                .map(Hit::source)
                .toList();
    }

    /**
     * Tìm kiếm keyword với khả năng chấp nhận sai sót (fuzzy search)
     *
     * @param keyword từ khóa tìm kiếm
     * @param page vị trí bắt đầu (phân trang)
     * @param size số lượng kết quả
     * @return danh sách sản phẩm
     */
    @Override
    public List<PublishedCourseDocument> searchDSLWithFuzzy(String keyword, int page, int size) throws IOException {

        int offset = page * size; // tính từ số trang

        // create query with multi-match and fuzzy
        Query query = MultiMatchQuery.of(m -> m
                .query(keyword)
                .fields("courseName^3", "description^2", "category") // boost courseName highest
                .fuzziness("AUTO") // automatic fuzziness (tự động điều chỉnh độ sai lệch)
                .prefixLength(2) // 2 first characters must match exactly
                .maxExpansions(50) // maximum variations
                .type(TextQueryType.BestFields) // best fields type
        )._toQuery();

        SearchRequest request = SearchRequest.of(s -> s
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .query(query)
                .from(offset)
                .size(size)
        );

        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(
                request,
                PublishedCourseDocument.class
        );

        return response.hits().hits().stream()
                .map(Hit::source)
                .toList();
    }

    /**
     * Tìm kiếm với completion (autocomplete)
     * Phù hợp cho gợi ý tìm kiếm
     */
    @Override
    public List<PublishedCourseDocument> searchCompletionDSL(String keyword, int page, int size) throws IOException {
        // ex: when user typing "app" in list [apple, snapchat, android] -> should return [apple] with boost highest
        // build prefix query for courseName with high boost
        Query prefixQuery = PrefixQuery.of(pq -> pq
                .field("courseName")
                .value(keyword.toLowerCase())
                .boost(3f)
        )._toQuery();

        // build multi-match query with fuzzy for other fields with lower boost
        Query matchQuery = MultiMatchQuery.of(m -> m
                .fields("description^2", "category")
                .query(keyword)
                .fuzziness("AUTO")
        )._toQuery();

        // combine both queries using bool query
        Query boolQuery = BoolQuery.of(b -> b
                .should(prefixQuery)
                .should(matchQuery)
        )._toQuery();

        SearchRequest request = SearchRequest.of(s -> s
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .query(boolQuery)
                .from(page * size)
                .size(size)
        );

        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(
                request,
                PublishedCourseDocument.class
        );

        return response.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm với nhiều tiêu chí filter
     *
     * @param keyword từ khóa tìm kiếm
     * @param filters đối tượng chứa các tiêu chí filter
     * @param page vị trí bắt đầu
     * @param size số lượng kết quả
     * @return danh sách sản phẩm
     */
    @Override
    public List<PublishedCourseDocument> searchDSLWithMultiFilter(String keyword,
                                                                  BigDecimal minPrice, BigDecimal maxPrice,
                                                                  Integer minRating,
                                                                  String category, String level,
                                                                  String practiceType, String sortBy,
                                                                  int page, int size) throws IOException {
        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();

        // Add must clause for keyword search
        if (this.validateStringParam(keyword)) {
            Query mustClause = MultiMatchQuery.of(m -> m
                    .query(keyword)
                    .fields("courseName^3", "description^2")
                    .fuzziness("AUTO")
            )._toQuery();
            boolQueryBuilder.must(mustClause);
        }

        // Add filter clauses based on provided filters
        // category criteria
        if (this.validateStringParam(level)) {
            Query levelFilter = TermQuery.of(tq -> tq
                    .field("level")
                    .value(level)
            )._toQuery();
            boolQueryBuilder.filter(levelFilter);
        }
        if (this.validateStringParam(category)) {
            Query categoryFilter = TermQuery.of(tq -> tq
                    .field("category")
                    .value(category)
            )._toQuery();
            boolQueryBuilder.filter(categoryFilter);
        }
        if (this.validateStringParam(practiceType)) {
            Query practiceTypeFilter = TermQuery.of(tq -> tq
                    .field("practiceType")
                    .value(practiceType)
            )._toQuery();
            boolQueryBuilder.filter(practiceTypeFilter);
        }

        // price range criteria
        if (minPrice!= null || maxPrice != null) {
            Query priceRangeQuery = NumberRangeQuery.of(r -> {
                var query = r.field("price");
                if (minPrice!= null) {
                    query.gte(Double.parseDouble(minPrice.toString()));
                }
                if (maxPrice!= null) {
                    query.gte(Double.parseDouble(maxPrice.toString()));
                }
                return query;
            })._toRangeQuery()._toQuery();
            boolQueryBuilder.filter(priceRangeQuery);
        }

        // build final query
        Query finalQuery = boolQueryBuilder.build()._toQuery();
        // build sort criteria
        List<SortOptions> sortOptions = switch (sortBy) {
            case "price_asc" -> List.of(SortOptions.of(s -> s
                    .field(f -> f
                            .field("price")
                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Asc)
                    )
            ));
            case "price_desc" -> List.of(SortOptions.of(s -> s
                    .field(f -> f
                            .field("price")
                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
                    )
            ));
            case "rating_desc" -> List.of(SortOptions.of(s -> s
                    .field(f -> f
                            .field("rating")
                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
                    )
            ));
            case "students_desc" -> List.of(SortOptions.of(s -> s
                    .field(f -> f
                            .field("studentsCount")
                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
                    )
            ));
            default -> List.of(); // no sorting
        };

        // build search request
        SearchRequest request = SearchRequest.of(s -> s
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .query(finalQuery)
                .from(page * size)
                .size(size)
                .sort(sortOptions)
        );

        SearchResponse<PublishedCourseDocument> response = elasticsearchClient.search(
                request,
                PublishedCourseDocument.class
        );

        return response.hits().hits().stream()
                .map(Hit::source)
                .toList();
    }

    private boolean validateStringParam(String param) {
        return param != null && !param.isEmpty();
    }


}
