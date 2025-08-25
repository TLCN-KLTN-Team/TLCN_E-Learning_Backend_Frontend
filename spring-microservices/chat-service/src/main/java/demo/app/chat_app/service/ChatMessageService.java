package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.request.TextMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.PageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

public interface ChatMessageService {

    // Original methods
    ChatMessageResponse sendMessage(ChatMessageRequest request, Principal principal);

    // New methods for separated architecture
    ChatMessageResponse sendTextMessage(TextMessageRequest request);
    ChatMessageResponse getMessageById(String messageId);

    List<ChatMessageResponse> getMessages(String channelId);
    PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size);
}
