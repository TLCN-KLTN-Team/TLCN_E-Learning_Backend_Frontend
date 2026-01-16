package demo.app.chat_app.repository;

import demo.app.chat_app.model.LessonMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LessonDiscussionRepository extends MongoRepository<LessonMessage, String> {
    
    /**
     * Find all discussion messages for a specific lesson
     */
    Page<LessonMessage> findByLessonIdAndIsDeletedFalseOrderByCreatedAtAsc(Integer lessonId, Pageable pageable);
    
    /**
     * Find all messages by lesson (including deleted for admin)
     */
    Page<LessonMessage> findByLessonIdOrderByCreatedAtAsc(Integer lessonId, Pageable pageable);
    
    /**
     * Find replies to a specific message
     */
    List<LessonMessage> findByParentMessageIdAndIsDeletedFalseOrderByCreatedAtAsc(String parentMessageId);
    
    /**
     * Count messages in a lesson
     */
    Long countByLessonIdAndIsDeletedFalse(Integer lessonId);
    
    /**
     * Count unread messages (created after a specific time)
     */
    Long countByLessonIdAndCreatedAtAfterAndIsDeletedFalse(Integer lessonId, LocalDateTime after);
}
