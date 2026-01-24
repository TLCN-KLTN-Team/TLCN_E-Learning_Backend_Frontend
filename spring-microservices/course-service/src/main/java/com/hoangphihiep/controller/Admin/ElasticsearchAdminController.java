package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.document.PublishedCourseDocument;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.service.OrderService;
import com.hoangphihiep.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/elasticsearch")
@RequiredArgsConstructor
public class ElasticsearchAdminController {

    private final PublishedCourseRepository publishedCourseRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ReviewService reviewService;
    private final OrderService orderService;

    /**
     * Reindex tất cả published courses vào Elasticsearch
     * DELETE old index -> CREATE new index with mapping -> INDEX all documents
     */
    @PostMapping("/reindex-courses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reindexCourses() {
        try {
            log.info("Starting reindex process for published courses...");
            
            // 1. Xóa index cũ nếu tồn tại
            IndexOperations indexOps = elasticsearchOperations.indexOps(PublishedCourseDocument.class);
            if (indexOps.exists()) {
                boolean deleted = indexOps.delete();
                log.info("Deleted old index: {}", deleted);
            }
            
            // 2. Tạo index mới với mapping
            boolean created = indexOps.create();
            log.info("Created new index: {}", created);
            
            // 3. Put mapping
            indexOps.putMapping(indexOps.createMapping());
            log.info("Put mapping successfully");
            
            // 4. Lấy tất cả published courses từ database
            List<PublishedCourse> courses = publishedCourseRepository.findAll();
            log.info("Found {} courses to index", courses.size());
            
            // 5. Convert sang documents và build completion fields
            List<PublishedCourseDocument> documents = courses.stream()
                    .map(this::toDocument)
                    .peek(doc -> doc.buildCompletionFields()) // Build completion suggestions
                    .collect(Collectors.toList());
            
            // 6. Bulk index
            Iterable<PublishedCourseDocument> indexed = elasticsearchOperations.save(documents);
            long indexedCount = documents.size();
            
            log.info("Reindexed {} courses successfully", indexedCount);
            
            // 7. Prepare response
            Map<String, Object> result = new HashMap<>();
            result.put("totalCourses", courses.size());
            result.put("indexedDocuments", indexedCount);
            result.put("indexName", "published_courses");
            result.put("status", "success");
            result.put("message", "All courses have been reindexed successfully");
            
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Reindex completed successfully")
                            .result(result)
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Reindex failed", e);
            
            Map<String, Object> error = new HashMap<>();
            error.put("status", "failed");
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Reindex failed: " + e.getMessage())
                            .result(error)
                            .build()
            );
        }
    }

    /**
     * Xóa index Elasticsearch
     */
    @DeleteMapping("/index/published-courses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteIndex() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(PublishedCourseDocument.class);
            
            if (!indexOps.exists()) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "not_found");
                result.put("message", "Index does not exist");
                
                return ResponseEntity.ok(
                        ApiResponse.<Map<String, Object>>builder()
                                .message("Index does not exist")
                                .result(result)
                                .build()
                );
            }
            
            boolean deleted = indexOps.delete();
            
            Map<String, Object> result = new HashMap<>();
            result.put("deleted", deleted);
            result.put("indexName", "published_courses");
            
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Index deleted successfully")
                            .result(result)
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Failed to delete index", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Failed to delete index: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Kiểm tra trạng thái index
     */
    @GetMapping("/index/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIndexStatus() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(PublishedCourseDocument.class);
            
            Map<String, Object> result = new HashMap<>();
            result.put("indexName", "published_courses");
            result.put("exists", indexOps.exists());
            
            if (indexOps.exists()) {
                // Count documents in index
                long count = elasticsearchOperations.count(
                        org.springframework.data.elasticsearch.core.query.Query.findAll(),
                        PublishedCourseDocument.class
                );
                result.put("documentCount", count);
                
                // Compare with database
                long dbCount = publishedCourseRepository.count();
                result.put("databaseCount", dbCount);
                result.put("inSync", count == dbCount);
            }
            
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Index status retrieved successfully")
                            .result(result)
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Failed to get index status", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Failed to get index status: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Index một khóa học cụ thể
     */
    @PostMapping("/index-course/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> indexSingleCourse(@PathVariable Integer courseId) {
        try {
            PublishedCourse course = publishedCourseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));
            
            PublishedCourseDocument document = toDocument(course);
            document.buildCompletionFields();
            
            elasticsearchOperations.save(document);
            
            Map<String, Object> result = new HashMap<>();
            result.put("courseId", courseId);
            result.put("courseName", course.getCourse().getCourseName());
            result.put("status", "indexed");
            
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Course indexed successfully")
                            .result(result)
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Failed to index course {}", courseId, e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Failed to index course: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Xóa một document cụ thể khỏi index
     */
    @DeleteMapping("/index-course/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteDocument(@PathVariable Integer courseId) {
        try {
            String documentId = elasticsearchOperations.delete(
                    String.valueOf(courseId),
                    PublishedCourseDocument.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("courseId", courseId);
            result.put("documentId", documentId);
            result.put("status", "deleted");
            
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Document deleted successfully")
                            .result(result)
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Failed to delete document {}", courseId, e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<Map<String, Object>>builder()
                            .message("Failed to delete document: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Convert PublishedCourse entity sang PublishedCourseDocument
     */
    private PublishedCourseDocument toDocument(PublishedCourse course) {
        return PublishedCourseDocument.builder()
                .id(course.getId().toString())
                .courseName(course.getCourse().getCourseName())
                .description(course.getCourse().getDescription())
                .courseIntroduction(course.getCourseIntroduction())
                .price(course.getCoursePrice())
                .category(course.getCourseType().getCourseTypeName())
                .level(null) // TODO: Add level field to PublishedCourse entity
                .instructor(course.getAuthorName())
                .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                .studentsCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                .createdAt(course.getCreatedAt() != null ?
                        course.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate() : null)
                .updatedAt(course.getUpdatedAt() != null ?
                        course.getUpdatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate() : null)
                .build();
    }
}
