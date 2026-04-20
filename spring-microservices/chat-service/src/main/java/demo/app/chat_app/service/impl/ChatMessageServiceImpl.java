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
    GetUserClient getUserClient;

    @Override
    public ChatMessageResponse sendMessage(ChatMessageRequest request, Principal principal) {
        // Validate and get channel
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // Get current user
        String userId = principal.getName();

        // Create and save message
        ChatMessage message = ChatMessage.builder()
                .channelId(request.getChannelId())
                .content(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);

        return this.toChatMessageResponse(message);
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());
        chatMessageResponse.setClientMessageId(chatMessage.getClientMessageId());
        chatMessageResponse.setStatus(chatMessage.getStatus());

        // Map attachments
        if (chatMessage.getAttachments() != null && !chatMessage.getAttachments().isEmpty()) {
            chatMessageResponse.setAttachments(
                    chatMessageMapper.toAttachmentResponseList(chatMessage.getAttachments())
            );
        } else {
            chatMessageResponse.setAttachments(Collections.emptyList());
        }

        // get user profile info
        try {
            UserResponse senderProfile = getUserClient.getUser(chatMessage.getSender()).getResult();
            chatMessageResponse.setSender(senderProfile);
        } catch (Exception e) {
            log.info("Failed to fetch user profile for userId: {}", chatMessage.getSender(), e);
            throw new AppException(ErrorCode.GET_USER_PROFILE_FAILED);
        }

        return chatMessageResponse;
    }

    @Override
    public List<ChatMessageResponse> getMessages(String channelId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify channel exists and user has access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        checkIsMemberChannel(channel, userId);

        // Use paginated query for better performance
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);

        if (messagePage.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<ChatMessageResponse> response = messagePage.getContent().stream()
                .map(this::toChatMessageResponse)
                .toList();

        return response;
    }
    
    // New method for paginated messages
    public PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify channel exists and user has access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);
        
        List<ChatMessageResponse> responses = messagePage.getContent().stream()
                .map(this::toChatMessageResponse)
                .toList();

        return PageResponse.<ChatMessageResponse>builder()
                .content(responses)
                .pageNumber(messagePage.getNumber())
                .pageSize(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    // ======== METHODS FOR POST-ATTACH PATTERN ========
    
    @Override
    public ChatMessageResponse sendTextMessage(TextMessageRequest request) {
        // Validate and get channel
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        String userId = JwtUtils.getUserId();

        // Create and save message with PENDING status
        // The message starts as PENDING; it will be updated to SENT when attachments are uploaded
        // or can remain as-is for text-only messages
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

        // Check if user has access to this message's channel
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Channel channel = channelRepository.findById(message.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        checkIsMemberChannel(channel, userId);

        return this.toChatMessageResponse(message);
    }

    private void checkIsMemberChannel(Channel channel, String userId) {
        ChannelMember channelMember = channelMemberService.getChannelMemberByChannelIdAndUserId(channel.getId(), userId);
    }

    private ChatMessageResponse toUploadedResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);

        return chatMessageResponse;
    }
}
