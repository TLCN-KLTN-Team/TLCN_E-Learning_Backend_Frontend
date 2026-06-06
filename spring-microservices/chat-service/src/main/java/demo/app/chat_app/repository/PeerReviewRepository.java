package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.PeerReview;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PeerReviewRepository extends MongoRepository<PeerReview, String> {

    /** Lookup khi upsert — unique key là 3 trường này. */
    Optional<PeerReview> findByAssignmentSessionIdAndReviewerChannelIdAndReviewedChannelId(
            String assignmentSessionId, String reviewerChannelId, String reviewedChannelId);

    /** Toàn bộ cặp chấm trong một session — dùng để thu điểm (collectAndCalculate). */
    List<PeerReview> findAllByAssignmentSessionId(String assignmentSessionId);

    /** Tất cả điểm nhóm reviewerChannelId đã nộp trong session — dùng để prefill form. */
    List<PeerReview> findAllByAssignmentSessionIdAndReviewerChannelId(
            String assignmentSessionId, String reviewerChannelId);
}
