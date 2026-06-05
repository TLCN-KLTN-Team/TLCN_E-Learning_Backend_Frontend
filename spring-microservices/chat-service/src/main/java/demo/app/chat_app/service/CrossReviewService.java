package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CrossReviewBatchSubmitRequest;
import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.response.CrossReviewScoreOfGroupResponse;
import demo.app.chat_app.dto.response.CrossReviewScoreResponse;
import demo.app.chat_app.dto.response.FinalScoreResponse;

import java.util.List;

public interface CrossReviewService {

    /**
     * Nhóm hiện tại (reviewerChannelId = channelId) submit điểm + nhận xét cho
     * nhóm mà mình được phân công chấm chéo. Upsert theo cặp (reviewer,
     * reviewed); bắn notification tới mọi thành viên nhóm bị chấm.
     */
    CrossReviewScoreResponse submitReview(String channelId, CrossReviewSubmitRequest request);

    /**
     * UC-41 Batch: nhóm nộp toàn bộ điểm đã lưu cục bộ trong một lần ("Nộp bài chấm").
     * Upsert CrossReviewScoreOfGroup (1 record per reviewer per session) và đồng thời
     * upsert từng CrossReviewScore riêng lẻ. Bắn notification tới mọi nhóm bị chấm.
     */
    CrossReviewScoreOfGroupResponse submitBatchReview(String channelId, CrossReviewBatchSubmitRequest request);

    /**
     * UC-41: Tính điểm cuối cùng của nhóm channelId theo thuật toán Median.
     *  - Thu thập điểm từ tất cả CrossReviewScoreOfGroup trong session.
     *  - Tính Median của điểm chấm chéo (loại trừ tự chấm).
     *  - |selfScore - median| ≤ 0.5 → finalScore = selfScore, ngược lại = median.
     */
    FinalScoreResponse calculateFinalScore(String channelId);

    /**
     * Tất cả điểm mà nhóm reviewerChannelId đã nộp trong session — FE dùng để
     * prefill từng form chấm theo reviewedChannelId.
     */
    List<CrossReviewScoreResponse> getMyReviews(String channelId);

    /**
     * Hồ sơ chấm chéo của một sinh viên — tất cả các lần bài của họ
     * được nhóm khác chấm.
     */
    List<CrossReviewScoreResponse> getScoresForStudent(String userId);
}
