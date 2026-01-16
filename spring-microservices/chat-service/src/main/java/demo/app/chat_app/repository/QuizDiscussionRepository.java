package demo.app.chat_app.repository;

import demo.app.chat_app.model.QuizMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizDiscussionRepository extends MongoRepository<QuizMessage, String> {
    
    /**
     * Find all discussion messages for a specific quiz
     */
    Page<QuizMessage> findByQuizIdAndIsDeletedFalseOrderByCreatedAtAsc(Integer quizId, Pageable pageable);
    
    /**
     * Find all messages by quiz (including deleted for admin)
     */
    Page<QuizMessage> findByQuizIdOrderByCreatedAtAsc(Integer quizId, Pageable pageable);
    
    /**
     * Find replies to a specific message
     */
    List<QuizMessage> findByParentMessageIdAndIsDeletedFalseOrderByCreatedAtAsc(String parentMessageId);
    
    /**
     * Count messages in a quiz
     */
    Long countByQuizIdAndIsDeletedFalse(Integer quizId);
    
    /**
     * Count unread messages (created after a specific time)
     */
    Long countByQuizIdAndCreatedAtAfterAndIsDeletedFalse(Integer quizId, LocalDateTime after);
}
