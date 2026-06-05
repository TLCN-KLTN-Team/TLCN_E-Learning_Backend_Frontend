package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.CrossReviewScoreOfGroup;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CrossReviewScoreOfGroupRepository extends MongoRepository<CrossReviewScoreOfGroup, String> {

    /** Tìm batch điểm của một nhóm trong một session (dùng để upsert). */
    Optional<CrossReviewScoreOfGroup> findByReviewerChannelIdAndAssignmentSessionId(
            String reviewerChannelId, String assignmentSessionId);

    /** Tất cả batch điểm trong một session — dùng để collect điểm của từng nhóm bị chấm. */
    List<CrossReviewScoreOfGroup> findAllByAssignmentSessionId(String assignmentSessionId);
}
