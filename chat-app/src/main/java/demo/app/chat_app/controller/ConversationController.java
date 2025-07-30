package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ConversationRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.ConversationResponse;
import demo.app.chat_app.service.impl.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping("/create")
    public ApiResponse<ConversationResponse> createConversation(@RequestBody ConversationRequest request){
        return ApiResponse.<ConversationResponse>builder()
                .code(1000)
                .message("Create conversation success")
                .result(conversationService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<ConversationResponse>> getMyConversations(){
        return ApiResponse.<List<ConversationResponse>>builder()
                .code(1000)
                .message("Load your conversations success")
                .result(conversationService.myConversations())
                .build();
    }

//    public ApiResponse<String> getCurrentConversationId(){
//        return ApiResponse.<String>builder()
//                .code(1000)
//                .message("Get current conversation id success")
//                .result(conversationService.getCurrentConversationId())
//                .build();
//    }

}
