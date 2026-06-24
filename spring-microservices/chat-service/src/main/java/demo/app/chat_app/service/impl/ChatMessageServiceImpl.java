package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.request.TextMessageRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import demo.app.chat_app.model.workspace.*;
import demo.app.chat_app.repository.*;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.ChannelMemberService;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.service.util.ChannelPhase;
import demo.app.chat_app.utils.JwtUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageServiceImpl implements ChatMessageService {
    ChatMessageRepository chatMessageRepository;
    ChatMessageMapper chatMessageMapper;
    ChannelRepository channelRepository;
    ChannelMemberService channelMemberService;
    SectionRepository sectionRepository;
    MessageAttachmentRepository messageAttachmentRepository;
    ChannelMemberRepository channelMemberRepository;
    GetUserClient getUserClient;

    @Override
    public ChatMessageResponse sendMessage(ChatMessageRequest request, Principal principal) {
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // UC-41: chặn gửi tin khi channel LOCKED (phiên chấm điểm đã kết thúc). REVIEW vẫn cho phép.
        ChannelPhase.assertOpenForMember(channel);

        String userId = principal.getName();

        ChatMessage message = ChatMessage.builder()
                .clientMessageId(request.getClientMessageId())
                .sender(userId)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .messageType(MessageType.TEXT)
                .status(MessageStatus.SENT)
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);

        return this.toChatMessageResponse(message);
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMe = chatMessage.getSender() != null && chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());
        chatMessageResponse.setClientMessageId(chatMessage.getClientMessageId());
        chatMessageResponse.setStatus(chatMessage.getStatus());

        // Load attachments separately from the dedicated collection (source of truth).
        List<MessageAttachment> attachments = messageAttachmentRepository.findByMessageId(chatMessage.getId());
        chatMessageResponse.setAttachments(
                attachments.isEmpty()
                        ? Collections.emptyList()
                        : chatMessageMapper.toAttachmentResponseList(attachments));

        chatMessageResponse.setSender(resolveSender(chatMessage.getChannelId(), chatMessage.getSender(), userId));

        return chatMessageResponse;
    }

    /**
     * Resolve sender info for a message — prefer denormalized ChannelMember data
     * (already enriched with nickname/avatar at member creation time), fall back to
     * user-service only when needed, and never throw. A missing user yields an
     * "Anonymous" placeholder so the message still renders.
     */
    private UserResponse resolveSender(String channelId, String senderUserId, String currentUserId) {
        if (senderUserId == null || senderUserId.isBlank()) {
            return anonymousUser(null);
        }

        try {
            ChannelMember member = channelMemberRepository
                    .findByChannelIdAndUserId(channelId, senderUserId)
                    .orElse(null);
            if (member != null && member.getNickname() != null && !member.getNickname().isBlank()) {
                return UserResponse.builder()
                        .id(member.getUserId())
                        .nickname(member.getNickname())
                        .studentId(member.getStudentId())
                        .avatarUrl(member.getAvatarUrl())
                        .isOwner(member.getRole() == ChannelRole.TEACHER)
                        .build();
            }
        } catch (Exception e) {
            log.debug("ChannelMember lookup failed for userId={}, channelId={}", senderUserId, channelId, e);
        }

        try {
            UserResponse profile = getUserClient.getUser(senderUserId).getResult();
            if (profile != null) {
                if (profile.getNickname() == null || profile.getNickname().isBlank()) {
                    String last = profile.getLastName() != null ? profile.getLastName() : "";
                    String first = profile.getFirstName() != null ? profile.getFirstName() : "";
                    String built = (last + " " + first).trim();
                    profile.setNickname(built.isBlank() ? null : built);
                }
                if (profile.getNickname() != null) {
                    return profile;
                }
            }
        } catch (Exception e) {
            log.info("Failed to fetch user profile for userId: {}", senderUserId);
        }

        return anonymousUser(senderUserId);
    }

    private UserResponse anonymousUser(String userId) {
        return UserResponse.builder()
                .id(userId)
                .nickname("Anonymous")
                .build();
    }

    @Override
    public List<ChatMessageResponse> getMessages(String channelId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        checkIsMemberChannel(channel, userId);

        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);

        if (messagePage.isEmpty()) {
            return new ArrayList<>();
        }

        return toChatMessageResponses(messagePage.getContent(), channelId, userId);
    }

    public PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);

        List<ChatMessageResponse> responses = toChatMessageResponses(messagePage.getContent(), channelId, userId);

        return PageResponse.<ChatMessageResponse>builder()
                .content(responses)
                .pageNumber(messagePage.getNumber())
                .pageSize(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    /**
     * Batch-aware version: fetches all attachments for the given messages in one
     * query (instead of N+1) and reuses {@link #resolveSender} for sender enrichment.
     */
    private List<ChatMessageResponse> toChatMessageResponses(List<ChatMessage> messages,
                                                              String channelId,
                                                              String currentUserId) {
        if (messages.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> messageIds = messages.stream().map(ChatMessage::getId).toList();
        Map<String, List<MessageAttachment>> attachmentsByMessage = messageAttachmentRepository
                .findByMessageIdInAndIsActiveTrue(messageIds)
                .stream()
                .collect(Collectors.groupingBy(MessageAttachment::getMessageId));

        return messages.stream()
                .map(msg -> {
                    var resp = chatMessageMapper.toChatMessageResponse(msg);
                    boolean isMe = msg.getSender() != null && msg.getSender().equals(currentUserId);
                    resp.setMe(isMe);
                    resp.setMessageType(msg.getMessageType());
                    resp.setClientMessageId(msg.getClientMessageId());
                    resp.setStatus(msg.getStatus());

                    List<MessageAttachment> msgAttachments = attachmentsByMessage.getOrDefault(msg.getId(), List.of());
                    resp.setAttachments(
                            msgAttachments.isEmpty()
                                    ? Collections.emptyList()
                                    : chatMessageMapper.toAttachmentResponseList(msgAttachments));

                    resp.setSender(resolveSender(channelId, msg.getSender(), currentUserId));
                    return resp;
                })
                .toList();
    }

    // ======== METHODS FOR POST-ATTACH PATTERN ========

    @Override
    public ChatMessageResponse sendTextMessage(TextMessageRequest request) {
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        ChannelPhase.assertOpenForMember(channel);

        String userId = JwtUtils.getUserId();

        ChatMessage message = ChatMessage.builder()
                .clientMessageId(request.getClientMessageId())
                .sender(userId)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .messageType(MessageType.TEXT)
                .status(request.isTextOnly() ? MessageStatus.SENT : MessageStatus.PENDING)
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);
        log.info("Text message created with ID: {} and clientMessageId: {}", message.getId(), message.getClientMessageId());

        return this.toChatMessageResponse(message);
    }

    @Override
    public ChatMessageResponse getMessageById(String messageId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Channel channel = channelRepository.findById(message.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        checkIsMemberChannel(channel, userId);

        return this.toChatMessageResponse(message);
    }

    private void checkIsMemberChannel(Channel channel, String userId) {
        channelMemberService.getChannelMemberByChannelIdAndUserId(channel.getId(), userId);
    }
}
