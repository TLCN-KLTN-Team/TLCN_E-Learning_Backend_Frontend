package demo.app.chat_app.service.util;

import demo.app.chat_app.dto.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class MongoUtilService {
    
    private final MongoTemplate mongoTemplate;

    /**
     * Create pagination with default sort
     */
    public Pageable createPageable(int page, int size, String sortField, Sort.Direction direction) {
        return PageRequest.of(page, size, Sort.by(direction, sortField));
    }

    /**
     * Convert Page to PageResponse
     */
    public <T, R> PageResponse<R> toPageResponse(Page<T> page, Function<T, R> mapper) {
        List<R> content = page.getContent().stream()
                .map(mapper)
                .toList();

        return PageResponse.<R>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Soft delete operation
     */
    public void softDelete(String id, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update()
                .set("deleted", true)
                .set("deletedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
        log.info("Soft deleted {} with id: {}", entityClass.getSimpleName(), id);
    }

    /**
     * Batch soft delete
     */
    public void softDeleteBatch(List<String> ids, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").in(ids));
        Update update = new Update()
                .set("deleted", true)
                .set("deletedAt", Instant.now());
        
        mongoTemplate.updateMulti(query, update, entityClass);
        log.info("Soft deleted {} {} records", ids.size(), entityClass.getSimpleName());
    }

    /**
     * Update timestamp
     */
    public void updateTimestamp(String id, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update().set("updatedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
    }

    /**
     * Check if document exists by field
     */
    public boolean existsByField(String fieldName, Object value, Class<?> entityClass) {
        Query query = new Query(Criteria.where(fieldName).is(value));
        return mongoTemplate.exists(query, entityClass);
    }

    /**
     * Count documents by criteria
     */
    public long countByCriteria(Criteria criteria, Class<?> entityClass) {
        Query query = new Query(criteria);
        return mongoTemplate.count(query, entityClass);
    }

    /**
     * Find one by criteria
     */
    public <T> T findOneByCriteria(Criteria criteria, Class<T> entityClass) {
        Query query = new Query(criteria);
        return mongoTemplate.findOne(query, entityClass);
    }

    /**
     * Find all by criteria with pagination
     */
    public <T> List<T> findByCriteriaWithPagination(Criteria criteria, Pageable pageable, Class<T> entityClass) {
        Query query = new Query(criteria).with(pageable);
        return mongoTemplate.find(query, entityClass);
    }

    /**
     * Add item to array field
     */
    public void addToArrayField(String id, String fieldName, Object item, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update()
                .addToSet(fieldName, item)
                .set("updatedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
    }

    /**
     * Remove item from array field
     */
    public void removeFromArrayField(String id, String fieldName, Object item, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update()
                .pull(fieldName, item)
                .set("updatedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
    }

    /**
     * Increment numeric field
     */
    public void incrementField(String id, String fieldName, Number increment, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update()
                .inc(fieldName, increment)
                .set("updatedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
    }

    /**
     * Update nested field
     */
    public void updateNestedField(String id, String fieldPath, Object value, Class<?> entityClass) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update()
                .set(fieldPath, value)
                .set("updatedAt", Instant.now());
        
        mongoTemplate.updateFirst(query, update, entityClass);
    }

    /**
     * Search with text index
     */
    public <T> List<T> textSearch(String searchText, Class<T> entityClass) {
        Query query = new Query(Criteria.where("$text").is(searchText));
        return mongoTemplate.find(query, entityClass);
    }

    /**
     * Aggregate count by field
     */
    public long aggregateCountByField(String fieldName, Object value, Class<?> entityClass) {
        Query query = new Query(Criteria.where(fieldName).is(value));
        return mongoTemplate.count(query, entityClass);
    }
}
