package demo.app.chat_app.repository;

import demo.app.chat_app.model.DiscussionReadStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscussionReadStatusRepository extends MongoRepository<DiscussionReadStatus, String> {
    
    /**
     * Find read status for a specific user and item
     */
    Optional<DiscussionReadStatus> findByUserIdAndItemTypeAndItemId(String userId, String itemType, Integer itemId);
    
    /**
     * Delete read status when item is deleted
     */
    void deleteByItemTypeAndItemId(String itemType, Integer itemId);
}
