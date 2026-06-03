package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.dto.response.SessionGroupSubmissionsResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.MessageAttachmentMapper;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.MessageAttachmentRepository;
import demo.app.chat_app.service.AttachmentService;
import demo.app.chat_app.service.util.ChannelPhase;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AttachmentServiceImpl implements AttachmentService {

    MessageAttachmentRepository attachmentRepository;
    AssignmentSessionRepository assignmentSessionRepository;
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
    public List<SessionGroupSubmissionsResponse> listSubmissionsForCrossReview(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        if (!channel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }
        if (ChannelPhase.of(channel, Instant.now()) != ChannelPhase.REVIEW) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }
        if (channel.getAssignmentSessionId() == null) {
            return Collections.emptyList();
        }

        AssignmentSession session = assignmentSessionRepository.findById(channel.getAssignmentSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        // Lấy tất cả channel trong session (bao gồm chính mình để tự chấm)
        List<String> allChannelIds = session.getChannelIds();

        if (allChannelIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Load channel info để lấy tên nhóm
        Map<String, String> channelNames = channelRepository.findAllById(allChannelIds).stream()
                .collect(Collectors.toMap(Channel::getId, Channel::getName));

        // Đặt nhóm mình lên đầu, rồi đến các nhóm khác
        List<String> orderedIds = new ArrayList<>();
        orderedIds.add(channelId);
        allChannelIds.stream().filter(id -> !id.equals(channelId)).forEach(orderedIds::add);

        // Build grouped response: mỗi nhóm kèm danh sách file SUBMISSION
        return orderedIds.stream()
                .filter(allChannelIds::contains)
                .map(id -> SessionGroupSubmissionsResponse.builder()
                        .channelId(id)
                        .channelName(channelNames.getOrDefault(id, id))
                        .files(mapper.toAttachmentResponseList(
                                attachmentRepository.findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(
                                        id, AttachmentCategory.SUBMISSION)))
                        .build())
                .collect(Collectors.toList());
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

    @Override
    public List<AttachmentResponse> listSessionSubmissionsForChannel(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        if (channel.getAssignmentSessionId() == null) {
            return Collections.emptyList();
        }
        AssignmentSession session = assignmentSessionRepository.findById(channel.getAssignmentSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));
        List<String> messageIds = session.getSubmittedFileMessageIds();
        if (messageIds == null || messageIds.isEmpty()) {
            return Collections.emptyList();
        }
        return mapper.toAttachmentResponseList(
                attachmentRepository.findByMessageIdInAndChannelIdAndIsActiveTrueOrderByUploadedAtDesc(
                        messageIds, channelId));
    }
}
