package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.request.TextMessageRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChatMessage;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.Section;
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

        // Find sender participant info
//        Participant sender = channel.getParticipants().stream()
//                .filter(p -> p.getUserId().equals(userId))
//                .findFirst()
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL));

        // Create and save message
        ChatMessage message = ChatMessage.builder()
//                .sender(sender)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);

        return this.toChatMessageResponse(message);
    }

//    private boolean isFile(MultipartFile file) {
//        String contentType = file.getContentType();
//    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());

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
        // For now, get first 50 messages - should be parameterized
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
                
//        if (!channel.hasParticipant(userId)) {
//            throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
//        }

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

    // ======== NEW METHODS FOR SEPARATED ARCHITECTURE ========
    
    @Override
    public ChatMessageResponse sendTextMessage(TextMessageRequest request) {
        // Validate and get channel
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        String userId = JwtUtils.getUserId();

        // Create and save message with PENDING status (for file uploads)
        ChatMessage message = ChatMessage.builder()
                .sender(userId)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);
        log.info("Text message created with ID: {}", message);

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
        if (channel.isPublic()) {
            // Public channel: toàn bộ SectionMember có quyền truy cập
            Section section = sectionRepository.findById(channel.getSectionId())
                    .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
            if (section.getSectionMembers() == null || !section.getSectionMembers().contains(userId)) {
                throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
            }
        } else {
            // Private/Group channel: chỉ ChannelMember ACTIVE mới truy cập được
            boolean isMember = channelMemberService.isActiveMember(channel.getId(), userId);
            if (!isMember) {
                throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
            }
        }
    }

    private ChatMessageResponse toUploadedResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);

        return chatMessageResponse;
    }
}
