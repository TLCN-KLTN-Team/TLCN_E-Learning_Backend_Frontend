package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.service.ChatMessageService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageController {
    ChatMessageService chatMessageService;

//    @PostMapping("/send")
//    public ApiResponse<ChatMessageResponse> sendMessage(
//            @Valid @RequestBody ChatMessageRequest request) {
//        ChatMessageResponse response = chatMessageService.createMessage(request);
//        return ApiResponse.<ChatMessageResponse>builder()
//                .result(response)
//                .message("Message sent successfully")
//                .build();
//    }

    @PostMapping("/send")
    public ApiResponse<?> sendMessage(@RequestPart("channelId") String channelId,
                            @RequestPart("content") String content,
                            @RequestPart(value = "attachments", required = false) MultipartFile[] attachments,
                            Principal principal) {
        try {
            SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
            ChatMessageRequest request = new ChatMessageRequest();
            request.setChannelId(channelId);
            request.setContent(content);
            if (attachments == null){
                // we just send text message
                ChatMessageResponse response = chatMessageService.sendMessage(request, principal);
                return ApiResponse.<ChatMessageResponse>builder()
                        .result(response)
                        .message("Message sent successfully")
                        .build();
            }else {
                // handle file and message
//                ChatMessageResponse response = chatMessageService.sendMessageWithAttachments(request, attachments, principal);
                return ApiResponse.<ChatMessageResponse>builder()
                        .result(null)
                        .message("Message with attachments sent successfully")
                        .build();
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        }
    }

    @GetMapping("/{channelId}")
    public ApiResponse<List<ChatMessageResponse>> getMessages(
            @PathVariable String channelId) {
        List<ChatMessageResponse> messages = chatMessageService.getMessages(channelId);
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .result(messages)
                .message("Messages retrieved successfully")
                .build();
    }

}
