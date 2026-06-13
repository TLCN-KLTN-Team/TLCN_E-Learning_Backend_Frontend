package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UC-41 — Kết quả tính điểm cuối cùng của một nhóm sau giai đoạn chấm chéo.
 *
 * Thuật toán (đồng bộ với ScoreCollectionService.applyMedianCalculation):
 *  1. Thu thập tất cả điểm chấm chéo mà nhóm nhận được từ các nhóm khác.
 *  2. Sắp xếp tăng dần → lấy trung vị "biên trái" (phần tử ở index (n-1)/2).
 *  3. So sánh điểm tự chấm (selfScore) với trung vị:
 *     - chưa có peer hoặc nhóm chưa tự chấm → finalScore = null (giáo viên nhập tay)
 *     - |selfScore - median| ≤ 0.5 → dùng selfScore (ghi nhận trung thực)
 *     - |selfScore - median| > 0.5 → dùng median
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalScoreResponse {

    private String channelId;

    /** Điểm nhóm tự chấm cho chính mình (null nếu chưa tự chấm). */
    private Double selfScore;

    /** Median của tất cả điểm chấm chéo từ các nhóm khác (null nếu chưa có ai chấm). */
    private Double medianScore;

    /** Điểm cuối cùng sau khi áp dụng thuật toán. */
    private Double finalScore;

    /** true nếu điểm cuối cùng lấy từ selfScore, false nếu lấy từ median. */
    private boolean usedSelfScore;

    /** Số nhóm (không kể tự chấm) đã nộp điểm chấm chéo cho nhóm này. */
    private int reviewerCount;
}
