package demo.app.chat_app.repository;

import demo.app.chat_app.model.PublishedAssignmentMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PublishedCourseAssignmentDiscussionRepository extends MongoRepository<PublishedAssignmentMessage, String> {
    
    Page<PublishedAssignmentMessage> findByPublishedCourseIdAndAssignmentId(
            Integer publishedCourseId,
            Integer assignmentId,
            Pageable pageable
    );
    
    long countByPublishedCourseIdAndAssignmentIdAndCreatedAtAfter(
            Integer publishedCourseId,
            Integer assignmentId,
            LocalDateTime createdAt
    );
}
