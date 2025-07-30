package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.ChatMessage;
import demo.app.chat_app.model.Conversation;
import demo.app.chat_app.model.ParticipantInfo;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.ConversationRepository;
import demo.app.chat_app.repository.httpclient.ProfileClient;
import demo.app.chat_app.service.ChatMessageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageServiceImpl implements ChatMessageService {
    ChatMessageRepository chatMessageRepository;
    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatMessageMapper chatMessageMapper;

    @Override
    public boolean existsConversation(String conversationId) {
        return false;
    }

    @Override
    public ChatMessageResponse createMessage(ChatMessageRequest request) {
        // check conversation exists
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CONVERSATION));

        // if exists, create message
        // sender is me
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        ParticipantInfo sender = conversation.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findAny().orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CONVERSATION));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .conversationId(request.getConversationId())
                .message(request.getMessage())
                .createdDate(Instant.now())
                .build();
        message = chatMessageRepository.save(message);

        conversation.addMessage(message);
        conversationRepository.save(conversation);

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
    public List<ChatMessageResponse> getMessages(String conversationId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        conversationRepository.findById(conversationId).orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CONVERSATION))
                .getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findAny().orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CONVERSATION));

        List<ChatMessage> messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);
        List<ChatMessageResponse> response = messages.stream()
                .map(this::toChatMessageResponse)
                .toList();

        return response;
    }
}
