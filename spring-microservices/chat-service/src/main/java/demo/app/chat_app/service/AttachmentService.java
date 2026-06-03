package demo.app.chat_app.service;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.dto.response.SessionGroupSubmissionsResponse;
import demo.app.chat_app.model.enums.AttachmentCategory;

import java.util.List;

public interface AttachmentService {

    /**
     * UC-41: list attachments theo channel + category (Tài liệu chung / Bài đã nộp).
     */
    List<AttachmentResponse> listByChannel(String channelId, AttachmentCategory category);

    /**
     * UC-41: list bài nộp của tất cả nhóm khác trong cùng AssignmentSession.
     * Mỗi phần tử trả về là một nhóm với danh sách file SUBMISSION của nhóm đó.
     * Chỉ truy cập được trong phase REVIEW. Throw nếu channel không bật chấm chéo.
     */
    List<SessionGroupSubmissionsResponse> listSubmissionsForCrossReview(String channelId);

    /**
     * List ảnh (IMAGE) đã gửi trong channel — phục vụ gallery "Ảnh đã gửi" trong panel info.
     * Trả mới nhất trước, chỉ những file còn active.
     */
    List<AttachmentResponse> listImagesByChannel(String channelId);

    /**
     * List file (mọi attachmentType trừ IMAGE) đã gửi trong channel — phục vụ
     * mục "File đã gửi" trong panel info. Trả mới nhất trước, active only.
     */
    List<AttachmentResponse> listFilesByChannel(String channelId);

    /**
     * UC-41: list các file SUBMISSION được track trong AssignmentSession, lọc theo channelId.
     * Dùng cho panel "Bài đã nộp" khi channel thuộc một assignment session.
     * Trả về empty list nếu channel không có assignmentSessionId.
     */
    List<AttachmentResponse> listSessionSubmissionsForChannel(String channelId);
}
