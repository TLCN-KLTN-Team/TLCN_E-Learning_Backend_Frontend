package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.MessageAttachmentMapper;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.enums.AttachmentType;
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
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AttachmentServiceImpl implements AttachmentService {

    MessageAttachmentRepository attachmentRepository;
    ChannelRepository channelRepository;
    MessageAttachmentMapper mapper;

    /** Mọi attachmentType được coi là "file" (tức không phải ảnh) khi render panel info. */
    private static final EnumSet<AttachmentType> NON_IMAGE_TYPES = EnumSet.of(
            AttachmentType.DOCUMENT,
            AttachmentType.VIDEO,
            AttachmentType.AUDIO,
            AttachmentType.OTHER
    );

    @Override
    public List<AttachmentResponse> listByChannel(String channelId, AttachmentCategory category) {
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
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(
                        channel.getReviewTargetChannelId(), AttachmentCategory.SUBMISSION));
    }

    @Override
    public List<AttachmentResponse> listImagesByChannel(String channelId) {
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByChannelIdAndAttachmentTypeAndIsActiveTrueOrderByUploadedAtDesc(
                        channelId, AttachmentType.IMAGE));
    }

    @Override
    public List<AttachmentResponse> listFilesByChannel(String channelId) {
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByChannelIdAndAttachmentTypeInAndIsActiveTrueOrderByUploadedAtDesc(
                        channelId, NON_IMAGE_TYPES));
    }
}
