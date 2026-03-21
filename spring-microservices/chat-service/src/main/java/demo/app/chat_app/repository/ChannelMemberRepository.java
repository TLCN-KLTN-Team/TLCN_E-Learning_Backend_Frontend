package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.MemberStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMemberRepository extends MongoRepository<ChannelMember, String> {

    // Find all members of a channel
    List<ChannelMember> findByChannelId(String channelId);

    // Find all active members of a channel
    List<ChannelMember> findByChannelIdAndStatus(String channelId, MemberStatus status);

    // Find all channels of a user
    List<ChannelMember> findByUserId(String userId);

    // Find all active channels of a user
    List<ChannelMember> findByUserIdAndStatus(String userId, MemberStatus status);

    // Find specific member in a channel
    Optional<ChannelMember> findByChannelIdAndUserId(String channelId, String userId);

    // Check if user is an active member of a channel
    boolean existsByChannelIdAndUserIdAndStatus(String channelId, String userId, MemberStatus status);

    // Find all members of a user in a section (for cascade operations)
    List<ChannelMember> findBySectionIdAndUserId(String sectionId, String userId);

    // Count active members in a channel
    long countByChannelIdAndStatus(String channelId, MemberStatus status);

    // Delete all members of a channel (when channel is deleted)
    void deleteByChannelId(String channelId);

    // Delete specific member from a channel
    void deleteByChannelIdAndUserId(String channelId, String userId);

    // Update status of all members of a user in a section (cascade BANNED from SectionMember)
    @Query("{ 'sectionId': ?0, 'userId': ?1 }")
    List<ChannelMember> findBySectionIdAndUserIdForCascade(String sectionId, String userId);

    // Find channels in section where user is a member
    @Query("{ 'sectionId': ?0, 'userId': ?1, 'status': 'ACTIVE' }")
    List<ChannelMember> findActiveMembershipsBySectionAndUser(String sectionId, String userId);
}
