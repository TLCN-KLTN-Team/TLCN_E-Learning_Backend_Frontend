package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.MessageAttachmentMapper;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.MessageAttachmentRepository;
import demo.app.chat_app.service.AttachmentService;
import demo.app.chat_app.service.util.ChannelPhase;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AttachmentServiceImpl implements AttachmentService {

    MessageAttachmentRepository attachmentRepository;
    ChannelRepository channelRepository;
    MessageAttachmentMapper mapper;

    @Override
    public List<AttachmentResponse> listByChannel(String channelId, AttachmentCategory category) {
        // tồn tại channel + category default GENERAL nếu null
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        AttachmentCategory cat = category != null ? category : AttachmentCategory.GENERAL;
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(channelId, cat));
    }

    @Override
    public List<AttachmentResponse> listSubmissionsForCrossReview(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        if (!channel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }
        if (channel.getReviewTargetChannelId() == null) {
            throw new AppException(ErrorCode.NO_CROSS_REVIEW_TARGET);
        }
        ChannelPhase phase = ChannelPhase.of(channel, Instant.now());
        if (phase != ChannelPhase.REVIEW) {
            // Chỉ phase REVIEW mới mở quyền xem bài cần chấm
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(
                        channel.getReviewTargetChannelId(), AttachmentCategory.SUBMISSION));
    }
}
