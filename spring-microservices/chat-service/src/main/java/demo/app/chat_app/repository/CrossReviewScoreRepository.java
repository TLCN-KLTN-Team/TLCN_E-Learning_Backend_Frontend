package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.CrossReviewScore;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CrossReviewScoreRepository extends MongoRepository<CrossReviewScore, String> {

    Optional<CrossReviewScore> findByReviewerChannelIdAndReviewedChannelId(
            String reviewerChannelId, String reviewedChannelId);

    /** Tất cả điểm mà nhóm reviewerChannelId đã nộp (nhiều nhóm bị chấm). */
    List<CrossReviewScore> findAllByReviewerChannelId(String reviewerChannelId);

    /**
     * Hồ sơ chấm chéo của một sinh viên — mọi điểm mà bài của sinh viên này
     * đã nhận được từ các nhóm chấm chéo.
     */
    List<CrossReviewScore> findByReviewedUserIdsContaining(String userId);
}
