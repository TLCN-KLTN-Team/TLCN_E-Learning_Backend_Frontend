package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.PageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

public interface ChatMessageService {
    boolean existsConversation(String channelId);
    ChatMessageResponse sendMessage(ChatMessageRequest request, Principal principal);
    ChatMessageResponse sendMessageWithAttachments(ChatMessageRequest request, MultipartFile[] attachments, Principal principal);
    List<ChatMessageResponse> getMessages(String channelId);
    PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size);
}
