package demo.app.chat_app.repository;

import demo.app.chat_app.model.AssignmentMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssignmentDiscussionRepository extends MongoRepository<AssignmentMessage, String> {
    
    /**
     * Find all discussion messages for a specific assignment
     */
    Page<AssignmentMessage> findByAssignmentIdAndIsDeletedFalseOrderByCreatedAtAsc(Integer assignmentId, Pageable pageable);
    
    /**
     * Find all messages by assignment (including deleted for admin)
     */
    Page<AssignmentMessage> findByAssignmentIdOrderByCreatedAtAsc(Integer assignmentId, Pageable pageable);
    
    /**
     * Find replies to a specific message
     */
    List<AssignmentMessage> findByParentMessageIdAndIsDeletedFalseOrderByCreatedAtAsc(String parentMessageId);
    
    /**
     * Count messages in an assignment
     */
    Long countByAssignmentIdAndIsDeletedFalse(Integer assignmentId);
    
    /**
     * Count unread messages (created after a specific time)
     */
    Long countByAssignmentIdAndCreatedAtAfterAndIsDeletedFalse(Integer assignmentId, LocalDateTime after);
}
