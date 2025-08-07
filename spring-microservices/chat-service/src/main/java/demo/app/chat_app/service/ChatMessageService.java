package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.PageResponse;

import java.util.List;

public interface ChatMessageService {
    boolean existsConversation(String channelId);
    ChatMessageResponse createMessage(ChatMessageRequest request);
    List<ChatMessageResponse> getMessages(String channelId);
    PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size);
}
