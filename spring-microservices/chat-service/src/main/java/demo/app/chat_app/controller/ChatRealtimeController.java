package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatRealtimeController {
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@RequestPart("message") ChatMessageRequest request,
                           @RequestPart(value = "attachments", required = false) MultipartFile attachments,
                           Principal principal) {
        try {
            SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
            if (attachments == null){
                // we just send text message
            }else {
                // handle file and message
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        }
    }
}
