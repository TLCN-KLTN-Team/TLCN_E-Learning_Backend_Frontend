package demo.app.chat_app.repository;

import demo.app.chat_app.model.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {
    
    // Find channels by workspace
    @Query("{ 'workspaceId': ?0 }")
    List<Channel> findByWorkspaceId(String workspaceId);
    
    // Find channels by workspace with pagination
    @Query("{ 'workspaceId': ?0 }")
    Page<Channel> findByWorkspaceId(String workspaceId, Pageable pageable);
    
    // Find channel by name in workspace
    @Query("{ 'workspaceId': ?0, 'channelName': ?1 }")
    Optional<Channel> findByWorkspaceIdAndChannelName(String workspaceId, String channelName);
    
    // Find channels where user is participant
    @Query("{ 'participants.userId': ?0 }")
    List<Channel> findChannelsByParticipantUserId(String userId);
    
    // Find channels in workspace where user is participant
    @Query("{ 'workspaceId': ?0, 'memberIds.userId': ?1 }")
    List<Channel> findByWorkspaceIdAndParticipantUserId(String workspaceId, String userId);

    Optional<Channel> findByChannelNameContainingIgnoreCase(String channelName);
    
    // Check if user is in channel
    @Query(value = "{ 'id': ?0, 'participants.userId': ?1 }", exists = true)
    boolean existsByIdAndParticipantUserId(String channelId, String userId);
    
    // Count channels in workspace
    @Query(value = "{ 'workspaceId': ?0 }", count = true)
    long countByWorkspaceId(String workspaceId);
    
    // Find channels by participant hash (for direct messages)
    @Query("{ 'participantHash': ?0 }")
    Optional<Channel> findByParticipantHash(String participantHash);
    
    // Search channels by name pattern
    @Query("{ 'workspaceId': ?0, 'channelName': { $regex: ?1, $options: 'i' } }")
    List<Channel> findByWorkspaceIdAndChannelNameContaining(String workspaceId, String namePattern);

    @Query("{ 'classId': ?0 }")
    Optional<Channel> findByClassId(Integer classId);

}
