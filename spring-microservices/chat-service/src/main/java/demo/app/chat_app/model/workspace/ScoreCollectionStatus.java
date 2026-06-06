package demo.app.chat_app.model.workspace;

/**
 * Trạng thái thu thập điểm cuối cùng của một AssignmentSession sau giai đoạn chấm chéo.
 *
 * PENDING      — chưa thu thập (mặc định sau khi tạo session)
 * COLLECTING   — đang chạy (khóa để tránh chạy song song)
 * COLLECTED    — đã thu thập và lưu thành công; chờ giáo viên xác nhận gửi sang LMS
 * FAILED       — thu thập thất bại; giáo viên có thể retry thủ công
 * SENT_TO_LMS  — giáo viên đã xác nhận gửi điểm sang course-service
 */
public enum ScoreCollectionStatus {
    PENDING,
    COLLECTING,
    COLLECTED,
    FAILED,
    SENT_TO_LMS
}
