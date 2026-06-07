package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * Bài tập nhóm (UC-41) hiển thị cho sinh viên trong một lớp.
 *
 * <p>Điểm theo nhóm — mọi thành viên cùng nhóm nhận cùng {@code finalScore}. Các đánh giá chỉ là
 * nội dung nhận xét ẩn danh (không lộ nhóm nào chấm / điểm thành phần), đúng thiết kế chấm chéo.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupAssignmentResponse {

    private Integer id;
    private String sessionId;
    private String channelId;
    private Integer classId;
    private Integer courseId;
    private String title;
    private String description;
    private Date submissionDeadline;
    private Date crossReviewDeadline;
    private Integer maxScore;

    /** Giai đoạn hiển thị (effectiveStatus — đã suy ra CROSS_REVIEW/COLLECTING từ deadline). */
    private String status;

    /** Điểm cuối của nhóm — null khi chưa có điểm. */
    private Double finalScore;

    /** Nội dung nhận xét ẩn danh nhóm nhận được. */
    private List<String> evaluations;
}
