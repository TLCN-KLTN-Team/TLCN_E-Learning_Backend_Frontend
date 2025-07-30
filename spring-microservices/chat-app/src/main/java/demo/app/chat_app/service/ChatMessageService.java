package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;

import java.util.List;

public interface ChatMessageService {
    boolean existsConversation(String conversationId);
    ChatMessageResponse createMessage(ChatMessageRequest request);
    List<ChatMessageResponse> getMessages(String conversationId);
}
