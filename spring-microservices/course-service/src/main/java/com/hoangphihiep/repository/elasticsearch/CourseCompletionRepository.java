package com.hoangphihiep.repository.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.CompletionSuggester;
import co.elastic.clients.elasticsearch.core.search.Suggestion;
import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.response.CompletionSuggestionResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.helper.Indices;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.document.Document;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.suggest.response.CompletionSuggestion;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
     * Search-as-you-type completion suggester
     * Trả về gợi ý ngay khi user đang gõ
     * completion without phase and term suggesters
     */
    public CompletionSuggestionResponse autoCompletion(String query) {

        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index(Indices.PUBLISHED_COURSE_INDEX)
                    .suggest(suggest -> suggest
                            .suggesters("completion", suggester -> suggester
                                    .prefix(query)
                                    .completion(CompletionSuggester.of(c -> c
                                            .field("titleSuggest")
                                            .size(5)
                                            .skipDuplicates(true)
                                    ))
                            )
                    )
            );

            SearchResponse<PublishedCourseDocument> response =
                    elasticsearchClient.search(searchRequest, PublishedCourseDocument.class);

            return extractAllSuggestions(response, query);
        } catch (IOException e) {
            throw new AppException(ErrorCode.ELASTICSEARCH_OPERATION_FAILED);
        }

    }

    public CompletionSuggestionResponse advancedCompletion(String query) {

        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index(Indices.PUBLISHED_COURSE_INDEX)
                    .suggest(suggest -> suggest
                            .suggesters("completion", suggester -> suggester
                                    .prefix(query)
                                    .completion(CompletionSuggester.of(c -> c
                                            .field("titleSuggest")
                                            .size(5)
                                            .skipDuplicates(true)
                                    ))
                            )
                            .suggesters("phrase", suggester -> suggester
                                    .text(query)
                                    .phrase(ph -> ph
                                            .field("courseName")
                                            .size(5)
                                    )
                            )
                            .suggesters("term", suggester -> suggester
                                    .text(query)
                                    .term(t -> t
                                            .field("courseName")
                                            .size(5)
                                    )
                            )
                    )
            );

            SearchResponse<PublishedCourseDocument> response =
                    elasticsearchClient.search(searchRequest, PublishedCourseDocument.class);

            return extractAllSuggestions(response, query);
        } catch (IOException e) {
            throw new AppException(ErrorCode.ELASTICSEARCH_OPERATION_FAILED);
        }

    }

    private CompletionSuggestionResponse extractAllSuggestions(
            SearchResponse<PublishedCourseDocument> response,
            String query
    ) {
        List<String> completions = new ArrayList<>();
        List<String> phrases = new ArrayList<>();
        List<String> terms = new ArrayList<>();

        Map<String, List<Suggestion<PublishedCourseDocument>>> suggestMap =
                response.suggest();

        if (suggestMap != null) {
            // Extract completion suggestions
            if (suggestMap.containsKey("completion")) {
                suggestMap.get("completion").forEach(suggestion -> {
                    suggestion.completion().options().forEach(option -> {
                        completions.add(option.text());
                    });
                });
            }

             //Extract phrase suggestions
            if (suggestMap.containsKey("phrase")) {
                suggestMap.get("phrase").forEach(suggestion -> {
                    suggestion.phrase().options().forEach(option -> {
                        phrases.add(option.text());
                    });
                });
            }

            // Extract term suggestions
            if (suggestMap.containsKey("term")) {
                suggestMap.get("term").forEach(suggestion -> {
                    suggestion.term().options().forEach(option -> {
                        terms.add(option.text());
                    });
                });
            }
        }

        return CompletionSuggestionResponse.builder()
                .query(query)
                .titleSuggestions(completions)
                .phraseSuggestions(phrases)
                .termsSuggestions(terms)
                .build();
    }
}
