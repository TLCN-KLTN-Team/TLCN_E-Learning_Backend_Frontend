package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.response.CrossReviewScoreResponse;

import java.util.List;

public interface CrossReviewService {

    /**
     * Nhóm hiện tại (reviewerChannelId = channelId) submit điểm + nhận xét cho
     * nhóm mà mình được phân công chấm chéo. Upsert theo cặp (reviewer,
     * reviewed); bắn notification tới mọi thành viên nhóm bị chấm.
     */
    CrossReviewScoreResponse submitReview(String channelId, CrossReviewSubmitRequest request);

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
