package demo.app.chat_app.service.util;

import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.workspace.ChatMessage;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatMessageUtils {

    private final ChatMessageMapper chatMessageMapper;
    private final GetUserClient getUserClient;

    public ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
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
            throw new AppException(ErrorCode.GET_USER_PROFILE_FAILED);
        }

        return chatMessageResponse;
    }

    public ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());

        // get user profile info
        try {
            UserResponse senderProfile = getUserClient.getUser(chatMessage.getSender()).getResult();
            chatMessageResponse.setSender(senderProfile);
        } catch (Exception e) {
            throw new AppException(ErrorCode.GET_USER_PROFILE_FAILED);
        }

        return chatMessageResponse;
    }
}
