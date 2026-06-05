package demo.app.chat_app.model.workspace;

/**
 * Trạng thái thu thập điểm cuối cùng của một AssignmentSession sau giai đoạn chấm chéo.
 *
 * PENDING   — chưa thu thập (mặc định sau khi tạo session)
 * COLLECTING— đang chạy (khóa để tránh chạy song song)
 * COLLECTED — đã thu thập và lưu thành công; Kafka event đã publish
 * FAILED    — thu thập thất bại; giáo viên có thể retry thủ công
 */
public enum ScoreCollectionStatus {
    PENDING,
    COLLECTING,
    COLLECTED,
    FAILED
}
