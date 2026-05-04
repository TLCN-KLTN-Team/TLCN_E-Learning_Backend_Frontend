package com.hoangphihiep.repository.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.response.CompletionSuggestionResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.helper.Indices;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.document.Document;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class CourseCompletionRepository {
    private final ElasticsearchClient elasticsearchClient;
    private final ElasticsearchOperations operations;

    // initialize index, because elastic data can't create completion field or some advanced field type
    // so we need to create index first
    public void createPublishedCourseIndex(){
        IndexCoordinates indexCoordinates = IndexCoordinates.of(Indices.PUBLISHED_COURSE_INDEX);

        // if index already exists, delete it
        try {
            if (operations.indexOps(indexCoordinates).exists()){
                operations.indexOps(indexCoordinates).delete();
            }

            // create new index
            operations.indexOps(indexCoordinates).create();

            // set mappings
            Map<String, Object> titleSuggest = Map.of(
                    "type", "completion",
                    "analyzer", "standard"
            );
            Map<String, Object> categorySuggest = Map.of(
                    "type", "completion",
                    "analyzer", "standard"
            );

            Map<String, Object> properties = Map.of(
                    "courseName", Map.of("type", "text"),
                    "description", Map.of("type", "text"),
                    "category", Map.of("type", "keyword"),
                    "price", Map.of("type", "double"),
                    "rating", Map.of("type", "double"),
                    "studentsCount", Map.of("type", "integer"),
                    "titleSuggest", titleSuggest,
                    "categorySuggest", categorySuggest
            );

            Map<String, Object> mapping = Map.of("properties", properties);
            operations.indexOps(PublishedCourseDocument.class).putMapping();

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void updateCompletionFields() {
        IndexOperations indexOps = operations.indexOps(PublishedCourseDocument.class);

        Map<String, Object> titleSuggest = Map.of(
                "type", "completion",
                "analyzer", "standard"
        );
        Map<String, Object> categorySuggest = Map.of(
                "type", "completion",
                "analyzer", "standard"
        );
        Map<String, Object> properties = Map.of(
                "titleSuggest", titleSuggest,
                "categorySuggest", categorySuggest
        );

        Map<String, Object> mapping = Map.of("properties", properties);

        Document document = Document.from(mapping);
        indexOps.putMapping(document);
    }

    /**
     * Fuzzy autocomplete suggestion dùng multi-match query thay vì Completion Suggester.
     *
     * Completion Suggester chỉ hỗ trợ prefix-based matching (chỉ match khi user gõ đúng
     * prefix của input), nên không hoạt động tốt khi:
     * - User gõ từ ở giữa hoặc cuối tên khóa học
     * - User gõ sai chính tả ở giữa từ
     * - Tên khóa học bắt đầu bằng ngôn ngữ khác (VD: "Học Spring Boot" không match "spring")
     *
     * Giải pháp: Dùng multi-match fuzzy query trên các field cơ bản (courseName, category,
     * description, instructor), trả về danh sách courseName distinct sắp xếp theo relevance.
     *
     * Cấu hình fuzziness:
     * - fuzziness("AUTO"): 0 edits cho 1-2 ký tự, 1 edit cho 3-5, 2 edits cho 6+
     * - prefixLength(2): 2 ký tự đầu phải đúng → giảm false positives
     * - maxExpansions(50): giới hạn số terms mở rộng → cân bằng performance vs recall
     */
    public CompletionSuggestionResponse autoCompletion(String query, int size) {
        try {
            var boolQuery = QueryBuilders.bool();

            String trimmedQuery = query.trim();

            // 1. Phrase match — trọng số cao nhất cho exact phrase
            boolQuery.should(QueryBuilders
                    .matchPhrase()
                    .field("courseName")
                    .query(trimmedQuery)
                    .boost(10.0f)
                    .build()._toQuery());

            // 2. Match với AND operator — tất cả từ phải xuất hiện
            boolQuery.should(QueryBuilders
                    .match()
                    .field("courseName")
                    .query(trimmedQuery)
                    .operator(Operator.And)
                    .boost(8.0f)
                    .build()._toQuery());

            // 3. Fuzzy multi-match — tìm gần đúng trên nhiều fields
            boolQuery.should(QueryBuilders
                    .multiMatch()
                    .query(trimmedQuery)
                    .fields("courseName^3", "category^2", "description^1.5", "instructor^1")
                    .fuzziness("AUTO")
                    .prefixLength(2)
                    .maxExpansions(50)
                    .operator(Operator.Or)
                    .boost(5.0f)
                    .build()._toQuery());

            // 4. Prefix match — cho trường hợp user đang gõ dở
            boolQuery.should(QueryBuilders
                    .matchBoolPrefix()
                    .field("courseName")
                    .query(trimmedQuery)
                    .boost(7.0f)
                    .build()._toQuery());

            // Ít nhất 1 clause phải match
            boolQuery.minimumShouldMatch("1");

            SearchRequest searchRequest = SearchRequest.of(sr -> sr
                    .index(Indices.PUBLISHED_COURSE_INDEX)
                    .query(boolQuery.build()._toQuery())
                    .size(size * 2) // fetch nhiều hơn để sau khi deduplicate vẫn đủ
                    .source(src -> src.filter(f -> f.includes("courseName"))) // chỉ lấy courseName
                    .sort(s -> s.score(sc -> sc.order(SortOrder.Desc)))
            );

            SearchResponse<PublishedCourseDocument> response =
                    elasticsearchClient.search(searchRequest, PublishedCourseDocument.class);

            // Extract distinct course names, giữ thứ tự relevance
            List<String> titleSuggestions = response.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(PublishedCourseDocument::getCourseName)
                    .filter(name -> name != null && !name.isEmpty())
                    .distinct()
                    .limit(size)
                    .collect(Collectors.toList());

            return CompletionSuggestionResponse.builder()
                    .titleSuggestions(titleSuggestions)
                    .build();

        } catch (IOException e) {
            log.error("Fuzzy autocomplete failed for query: {}", query, e);
            throw new AppException(ErrorCode.ELASTICSEARCH_OPERATION_FAILED);
        }
    }

}
