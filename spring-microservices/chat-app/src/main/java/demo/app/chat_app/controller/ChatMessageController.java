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

    @PostMapping("/create")
    public ApiResponse<ChatMessageResponse> createMessage(@RequestBody @Valid ChatMessageRequest request){
        return ApiResponse.<ChatMessageResponse>builder()
                .code(1000)
                .message("Create message successfully")
                .result(chatMessageService.createMessage(request))
                .build();
    }

    @GetMapping("/{conversationId}")
    public ApiResponse<List<ChatMessageResponse>> getMessages(@PathVariable String conversationId){
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .code(1000)
                .message("Load messages successfully")
                .result(chatMessageService.getMessages(conversationId))
                .build();
    }

}
