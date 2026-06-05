package demo.app.chat_app.service;

import demo.app.chat_app.model.workspace.GroupFinalScore;

import java.util.List;

public interface ScoreCollectionService {

    /**
     * Thu thập và tính điểm cuối cùng cho tất cả nhóm trong một AssignmentSession.
     *
     * Logic:
     * - Nhóm chưa nộp bài → status = NO_SUBMISSION (bỏ qua)
     * - Nhóm đã nộp nhưng chưa có peer nào chấm → status = NO_PEERS
     * - Nhóm đã nộp và có ít nhất 1 peer chấm → tính median, áp dụng công thức self-score
     *
     * Idempotent: nếu session đã COLLECTED thì trả về kết quả cũ ngay.
     * Sau khi hoàn thành, publish ScoreCalculatedEvent lên Kafka.
     *
     * @throws AppException(SCORE_COLLECTION_FAILED) nếu có lỗi trong quá trình tính điểm
     */
    List<GroupFinalScore> collectAndCalculate(String sessionId);

    /**
     * Lấy kết quả điểm cuối đã thu thập của một session.
     */
    List<GroupFinalScore> getSessionScores(String sessionId);
}
