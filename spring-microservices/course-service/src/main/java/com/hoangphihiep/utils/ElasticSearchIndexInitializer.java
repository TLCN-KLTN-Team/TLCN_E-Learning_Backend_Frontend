package com.hoangphihiep.utils;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.helper.Indices;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.elasticsearch.CourseCompletionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ElasticSearchIndexInitializer {
    private final ElasticsearchOperations operations;
    private final ElasticsearchClient elasticsearchClient;
    private final CourseCompletionRepository courseCompletionRepository;
    private final PublishedCourseRepository publishedCourseRepository;

    @PostConstruct
    public void initialize() {
        List<Class<?>> documents = List.of(
                PublishedCourseDocument.class
        );

        documents.forEach(clazz -> {
            IndexOperations indexOps = operations.indexOps(clazz);
            if (!indexOps.exists()) {
                indexOps.create();
                indexOps.putMapping(indexOps.createMapping(clazz));
            }
        });
    }

    /**
     * Đếm số documents trong index
     */
    private long getDocumentCount() throws IOException {
        try {
            var response = elasticsearchClient.count(c -> c
                    .index(Indices.PUBLISHED_COURSE_INDEX)
            );
            return response.count();
        } catch (ElasticsearchException e) {
            log.warn("Không thể đếm documents, có thể index chưa tồn tại");
            return 0;
        }
    }

    /**
     * Bulk index toàn bộ courses
     * Sử dụng @Transactional để đảm bảo data consistency
     */
    @Transactional(readOnly = true)
    public void bulkIndexCoursesIfNotExists() throws IOException {
        if (this.getDocumentCount() == 0) {
            List<PublishedCourse> publishedCourses = publishedCourseRepository.findAll();
            for (PublishedCourse course : publishedCourses) {
                try {
                    this.indexCourse(course);
                } catch (IOException e) {
                    throw new AppException(ErrorCode.ELASTICSEARCH_OPERATION_FAILED);
                }
            }
        }
    }

    public void indexCourse(PublishedCourse course) throws IOException {
        PublishedCourseDocument document = this.toCourseDocument(course);
        document.buildCompletionFields();

        elasticsearchClient.index(req -> req
                .index(Indices.PUBLISHED_COURSE_INDEX)
                .id(document.getId())
                .document(document)
        );
    }

    private PublishedCourseDocument toCourseDocument(PublishedCourse course) {
        return PublishedCourseDocument.builder()
                .id(course.getId().toString())
                .courseName(course.getCourse().getCourseName())
                .description(course.getCourse().getDescription())
                .price(course.getCoursePrice())
                .category(course.getCourseType().getCourseTypeName())
                .build();
    }

    // different documents below here

}
