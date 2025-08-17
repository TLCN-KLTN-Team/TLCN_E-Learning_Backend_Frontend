package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.service.ChatMessageService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

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
