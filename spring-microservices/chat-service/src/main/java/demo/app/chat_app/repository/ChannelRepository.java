package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {

    // Find channels by section
    List<Channel> findBySectionId(String sectionId);

    // Find channels by section with pagination
    Page<Channel> findBySectionId(String sectionId, Pageable pageable);

    // Find channel by name in section
    Optional<Channel> findBySectionIdAndName(String sectionId, String name);

    // Search channels by name (case-insensitive)
    Optional<Channel> findByNameContainingIgnoreCase(String name);

    // Count channels in a section
    long countBySectionId(String sectionId);

    // Search channels by name pattern in section
    @Query("{ 'sectionId': ?0, 'name': { $regex: ?1, $options: 'i' } }")
    List<Channel> findBySectionIdAndNameContaining(String sectionId, String namePattern);

    // Find the public (MAIN) channel of a section
    Optional<Channel> findBySectionIdAndIsPublicTrue(String sectionId);

    List<Channel> findAllBySectionId(String sectionId);

    // ── UC-41: Scheduler queries ─────────────────────────────────
    /**
     * Channels đã qua hạn nộp nhưng scheduler chưa đóng giai đoạn nộp
     * (idempotent: chạy 1 lần/channel khi submissionClosedAt vẫn null).
     */
    @Query("{ 'status': ?0, 'submissionDeadline': { $lte: ?1 }, 'submissionClosedAt': null }")
    List<Channel> findChannelsToCloseSubmission(ChannelStatus status, Instant now);

    /**
     * Channels chấm chéo đã qua hạn cross-review → cần archive.
     */
    @Query("{ 'status': ?0, 'allowCrossReview': true, 'crossReviewDeadline': { $lte: ?1 } }")
    List<Channel> findChannelsToArchiveAfterCrossReview(ChannelStatus status, Instant now);
}
