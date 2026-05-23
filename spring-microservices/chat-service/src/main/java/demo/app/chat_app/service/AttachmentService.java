package demo.app.chat_app.service;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.model.enums.AttachmentCategory;

import java.util.List;

public interface AttachmentService {

    /**
     * UC-41: list attachments theo channel + category (Tài liệu chung / Bài đã nộp).
     */
    List<AttachmentResponse> listByChannel(String channelId, AttachmentCategory category);

    /**
     * UC-41: list bài đã nộp của nhóm mà channelId được phân công chấm chéo.
     * Throw nếu channel không bật chấm chéo, chưa đến phase REVIEW, hoặc chưa được pair.
     */
    List<AttachmentResponse> listSubmissionsForCrossReview(String channelId);

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
}
