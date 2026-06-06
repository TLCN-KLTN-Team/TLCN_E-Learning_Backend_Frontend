package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CrossReviewBatchSubmitRequest;
import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.response.CrossReviewScoreOfGroupResponse;
import demo.app.chat_app.dto.response.CrossReviewScoreResponse;
import demo.app.chat_app.dto.response.FinalScoreResponse;

import java.util.List;

public interface CrossReviewService {

    /**
     * Nhóm hiện tại submit điểm + nhận xét cho nhóm được phân công chấm chéo.
     * Upsert theo (sessionId, reviewerChannelId, reviewedChannelId);
     * bắn notification tới mọi thành viên nhóm bị chấm.
     */
    CrossReviewScoreResponse submitReview(String channelId, CrossReviewSubmitRequest request);

    /**
     * UC-41 Batch: nhóm nộp toàn bộ điểm trong một lần ("Nộp bài chấm").
     * Upsert từng PeerReview theo (sessionId, reviewerChannelId, reviewedChannelId);
     * bắn notification tới mọi nhóm bị chấm.
     */
    CrossReviewScoreOfGroupResponse submitBatchReview(String channelId, CrossReviewBatchSubmitRequest request);

    /**
     * UC-41: Tính điểm cuối cùng của nhóm channelId theo thuật toán Median.
     *  - Thu thập điểm từ tất cả PeerReview trong session có reviewedChannelId = channelId.
     *  - Tính Median của điểm chấm chéo (loại trừ self-review).
     *  - |selfScore - median| ≤ 0.5 → finalScore = selfScore, ngược lại = median.
     */
    FinalScoreResponse calculateFinalScore(String channelId);

    /**
     * Tất cả điểm mà nhóm channelId đã nộp trong session — FE dùng để
     * prefill từng form chấm theo reviewedChannelId.
     */
    List<CrossReviewScoreResponse> getMyReviews(String channelId);
}
