package demo.app.chat_app.service;

import demo.app.chat_app.model.workspace.GroupFinalScore;

import java.util.List;

public interface ScoreCollectionService {

    /**
     * Thu thập và tính điểm cuối cùng cho tất cả nhóm trong một AssignmentSession.
     *
     * Logic:
     * - Nhóm chưa nộp bài → status = NO_SUBMISSION
     * - Nhóm đã nộp nhưng chưa có peer nào chấm → status = NO_PEERS
     * - Nhóm đã nộp và có ít nhất 1 peer chấm → tính median, áp dụng công thức self-score
     *
     * Idempotent: nếu session đã COLLECTED/SENT_TO_LMS thì trả về kết quả cũ ngay.
     * KHÔNG tự động gửi Kafka — giáo viên phải xem xét rồi gọi sendScoresToLms().
     *
     * @throws AppException(SCORE_COLLECTION_FAILED) nếu có lỗi trong quá trình tính điểm
     */
    List<GroupFinalScore> collectAndCalculate(String sessionId);

    /**
     * Lấy kết quả điểm cuối đã thu thập của một session.
     */
    List<GroupFinalScore> getSessionScores(String sessionId);

    /**
     * Giáo viên xác nhận gửi điểm sang course-service (LMS) qua Kafka.
     * Chỉ gọi được khi session đã ở trạng thái COLLECTED hoặc SENT_TO_LMS.
     * Idempotent: cho phép gửi lại sau khi chỉnh sửa điểm thủ công.
     *
     * @throws AppException(SCORE_NOT_COLLECTED_YET) nếu chưa collect
     */
    List<GroupFinalScore> sendScoresToLms(String sessionId);

    /**
     * Giáo viên chỉnh sửa điểm cuối của một nhóm (ghi đè finalScore).
     * Đặt manuallyOverridden = true; không tính lại từ peer scores.
     * Chỉ cho phép sau khi đã collect (status COLLECTED hoặc SENT_TO_LMS).
     *
     * @throws AppException(CROSS_REVIEW_SCORE_INVALID) nếu score ngoài [0, 10]
     * @throws AppException(GROUP_SCORE_NOT_FOUND) nếu chưa có bản ghi GroupFinalScore
     */
    GroupFinalScore updateGroupFinalScore(String sessionId, String channelId, Double newFinalScore);

    /**
     * [DEV/TEST ONLY] Reset scoreCollectionStatus về null để buộc recompute lần sau gọi collectAndCalculate.
     * Xóa luôn các GroupFinalScore cũ để tránh stale data.
     *
     * @throws AppException(ASSIGNMENT_SESSION_NOT_FOUND) nếu session không tồn tại
     */
    void resetScoreCollection(String sessionId);
}
