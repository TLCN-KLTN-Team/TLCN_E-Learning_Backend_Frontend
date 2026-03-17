package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    // Paginated messages for a channel (most recent first)
    @Query("{ 'channelId': ?0, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdAndNotDeleted(String channelId, Pageable pageable);
    
    // Get messages by channel with pagination - ordered by creation date desc
    @Query("{ 'channelId': ?0 }")
    Page<ChatMessage> findAllByChannelId(String channelId, Pageable pageable);
    
    // Legacy method - replace with paginated version
    @Query("{ 'channelId': ?0 }")
    List<ChatMessage> findAllByChannelIdOrderByCreatedDateDesc(String channelId);
    
    // Find messages by sender in a channel
    @Query("{ 'channelId': ?0, 'sender.userId': ?1, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdAndSenderUserId(String channelId, String userId, Pageable pageable);
    
    // Find messages in a date range
    @Query("{ 'channelId': ?0, 'createdDate': { $gte: ?1, $lte: ?2 }, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdAndCreatedDateBetween(
            String channelId, Instant startDate, Instant endDate, Pageable pageable);
    
    // Count messages in a channel
    @Query(value = "{ 'channelId': ?0, 'deleted': { $ne: true } }", count = true)
    long countByChannelIdAndNotDeleted(String channelId);
    
    // Find messages with attachments
    @Query("{ 'channelId': ?0, 'attachments': { $exists: true, $not: { $size: 0 } }, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdWithAttachments(String channelId, Pageable pageable);
    
    // Search messages by content
    @Query("{ 'channelId': ?0, 'message': { $regex: ?1, $options: 'i' }, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdAndMessageContaining(String channelId, String searchText, Pageable pageable);
    
    // Find recent messages (used for notifications)
    @Query("{ 'channelId': ?0, 'createdDate': { $gte: ?1 }, 'deleted': { $ne: true } }")
    List<ChatMessage> findRecentMessagesByChannelId(String channelId, Instant since);
    
    // Soft delete messages
    @Query("{ 'id': ?0 }")
    @org.springframework.data.mongodb.repository.Update("{ $set: { 'deleted': true, 'updatedDate': ?1 } }")
    void softDeleteMessage(String messageId, Instant deletedAt);
}
