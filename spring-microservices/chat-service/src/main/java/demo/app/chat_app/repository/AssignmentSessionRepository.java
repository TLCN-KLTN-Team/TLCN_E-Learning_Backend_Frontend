package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.ScoreCollectionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface AssignmentSessionRepository extends MongoRepository<AssignmentSession, String> {

    List<AssignmentSession> findAllBySectionId(String sectionId);

    /**
     * Tìm các session đã qua crossReviewDeadline, bật cross-review,
     * và chưa thu thập điểm thành công — dùng bởi scheduler để auto-collect.
     */
    List<AssignmentSession> findByCrossReviewDeadlineBeforeAndAllowCrossReviewTrueAndScoreCollectionStatusIn(
            Instant deadline, List<ScoreCollectionStatus> statuses);

    /**
     * Tìm các session cũ được tạo trước khi field scoreCollectionStatus tồn tại
     * (field = null trong MongoDB). Cần reset về PENDING để scheduler pickup được.
     */
    List<AssignmentSession> findByCrossReviewDeadlineBeforeAndAllowCrossReviewTrueAndScoreCollectionStatusIsNull(
            Instant deadline);
}
