package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.*;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.ProfileClient;
import demo.app.chat_app.service.ChatMessageService;
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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageServiceImpl implements ChatMessageService {
    ChatMessageRepository chatMessageRepository;
    ProfileClient profileClient;
    ChatMessageMapper chatMessageMapper;
    ChannelRepository channelRepository;
    WorkspaceRepository workspaceRepository;

    @Override
    public boolean existsConversation(String conversationId) {
        return false;
    }

    @Override
    public ChatMessageResponse createMessage(ChatMessageRequest request, Principal principal) {
        // Validate and get channel
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // Get current user
        String userId = principal.getName();

        // Find sender participant info
        Participant sender = channel.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL));

        // Create and save message
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .channelId(request.getChannelId())
                .message(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();
        
        message = chatMessageRepository.save(message);

        return this.toChatMessageResponse(message);
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMe = chatMessage.getSender().getUserId().equals(userId);
        chatMessageResponse.setMe(isMe);

        return chatMessageResponse;
    }

    @Override
    public List<ChatMessageResponse> getMessages(String channelId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify channel exists and user has access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
                
        if (!channel.hasParticipant(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
        }

        // Use paginated query for better performance
        // For now, get first 50 messages - should be parameterized
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);
        
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
                
        if (!channel.hasParticipant(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
        }

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
}
