package demo.app.chat_app.repository;

import demo.app.chat_app.model.PublishedQuizMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PublishedCourseQuizDiscussionRepository extends MongoRepository<PublishedQuizMessage, String> {
    
    Page<PublishedQuizMessage> findByPublishedCourseIdAndQuizId(
            Integer publishedCourseId, 
            Integer quizId, 
            Pageable pageable
    );

    long countByPublishedCourseIdAndQuizId(
            Integer publishedCourseId,
            Integer quizId
    );
    
    long countByPublishedCourseIdAndQuizIdAndCreatedAtAfter(
            Integer publishedCourseId,
            Integer quizId,
            LocalDateTime createdAt
    );
}
