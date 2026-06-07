package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * Bài tập nhóm (UC-41) — bản ghi phía course-service cho điểm cuối của MỘT nhóm (channel).
 *
 * <p>Mỗi record = một nhóm trong một phiên chấm chéo bên chat-service. Vòng đời được điều khiển
 * hoàn toàn bằng Kafka event (không có FK cứng sang course/class — chỉ lưu id tham chiếu mềm):</p>
 * <ol>
 *   <li>Giáo viên tạo phiên ở chat-service → event {@code ASSIGNMENT_SESSION_CREATED} → course-service
 *   tạo một record cho mỗi channel với {@code status = SUBMISSION}, chưa có điểm.</li>
 *   <li>Sau khi thu thập & giáo viên gửi điểm → event {@code SCORE_CALCULATED} → cập nhật
 *   {@code finalScore}, {@code evaluations} (chỉ nội dung nhận xét) và {@code status} cuối cùng.</li>
 * </ol>
 *
 * <p>Điểm là theo nhóm; mọi thành viên trong {@code memberUserIds} nhận cùng {@code finalScore}
 * (bài nộp chung) nên không cần bảng điểm theo từng thành viên riêng.</p>
 */
@Entity
@Table(name = "group_assignment",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_group_assignment_session_channel",
                columnNames = {"session_id", "channel_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupAssignment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Đang nộp bài (trước submissionDeadline). */
    public static final String STATUS_SUBMISSION = "SUBMISSION";
    /** Đang chấm chéo (sau submissionDeadline, trước crossReviewDeadline). */
    public static final String STATUS_CROSS_REVIEW = "CROSS_REVIEW";
    /** Hết hạn chấm chéo, đang thu thập/tính điểm — chưa có điểm cuối. */
    public static final String STATUS_COLLECTING = "COLLECTING";
    /** Đã có điểm cuối. */
    public static final String STATUS_COMPLETED = "COMPLETED";
    /** Nhóm không nộp bài → không có điểm. */
    public static final String STATUS_NO_SUBMISSION = "NO_SUBMISSION";
    /** Nhóm có nộp nhưng không ai chấm chéo → không có điểm. */
    public static final String STATUS_NO_PEERS = "NO_PEERS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    /** Id AssignmentSession bên chat-service. */
    @Column(name = "session_id", length = 100, nullable = false)
    private String sessionId;

    /** Channel của nhóm bên chat-service. */
    @Column(name = "channel_id", length = 100, nullable = false)
    private String channelId;

    /** CourseClass đích (tham chiếu mềm). */
    @Column(name = "class_id")
    private Integer classId;

    /** Course đích (tham chiếu mềm). */
    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "submission_deadline")
    private Date submissionDeadline;

    @Column(name = "cross_review_deadline")
    private Date crossReviewDeadline;

    @Column(name = "max_score")
    private Integer maxScore;

    /** Giai đoạn của phiên — xem các hằng STATUS_*. */
    @Column(name = "status", length = 30)
    private String status;

    /** Điểm cuối của nhóm (null khi chưa tính xong / NO_SUBMISSION / NO_PEERS). */
    @Column(name = "final_score")
    private Double finalScore;

    /** Snapshot thành viên nhóm — mọi thành viên nhận cùng {@link #finalScore}. */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "group_assignment_members",
            joinColumns = @JoinColumn(name = "group_assignment_id"))
    @Column(name = "user_id", length = 100)
    private List<String> memberUserIds;

    /** Các đánh giá nhóm nhận được — chỉ nội dung nhận xét, KHÔNG lưu nhóm nào chấm. */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "group_assignment_evaluations",
            joinColumns = @JoinColumn(name = "group_assignment_id"))
    @Column(name = "comment", length = 2000)
    private List<String> evaluations;

    @Column(name = "created_at")
    private Date createdAt;

    @Column(name = "updated_at")
    private Date updatedAt;

    /**
     * Giai đoạn hiển thị thực tế cho UI.
     *
     * <p>Chỉ có 2 event cập nhật record (tạo phiên & tính điểm) nên các giai đoạn trung gian
     * {@code CROSS_REVIEW}/{@code COLLECTING} không được ghi sẵn — chúng được suy ra từ deadline so
     * với hiện tại khi record vẫn ở {@code SUBMISSION}. Các trạng thái kết thúc
     * (COMPLETED/NO_SUBMISSION/NO_PEERS) trả nguyên trạng.</p>
     */
    @Transient
    public String getEffectiveStatus() {
        if (status == null || !STATUS_SUBMISSION.equals(status)) {
            return status;
        }
        Date now = new Date();
        if (submissionDeadline != null && now.before(submissionDeadline)) {
            return STATUS_SUBMISSION;
        }
        if (crossReviewDeadline != null && now.before(crossReviewDeadline)) {
            return STATUS_CROSS_REVIEW;
        }
        return STATUS_COLLECTING;
    }
}
