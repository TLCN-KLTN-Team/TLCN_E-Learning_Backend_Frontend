package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.TextMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.websocket.WebsocketSessionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatRealtimeController {
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle text-only messages via WebSocket for real-time communication
     * Files should be uploaded separately via REST API
     */
    @MessageMapping("/chat.sendMessage")
    public void sendTextMessage(@Payload TextMessageRequest request, SimpMessageHeaderAccessor accessor) {
        try {
            String userId = WebsocketSessionUtil.getCurrentUserId(accessor);
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(userId, null, null);
            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            log.info("Received text message for channel: {}", request.getChannelId());
            
            // Send text message immediately (placeholder with PENDING status)
            ChatMessageResponse response = chatMessageService.sendTextMessage(request);
            
            // Broadcast to channel subscribers
            messagingTemplate.convertAndSend(
                "/topic/channel/" + request.getChannelId(), 
                response
            );
            
            log.info("Text message sent successfully: {}", response.getId());
            
        } catch (Exception e) {
            log.error("Failed to send text message", e);
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        }
    }

    /**
     * Handle message status updates (e.g., when attachments are uploaded)
     */
    @MessageMapping("/chat.updateMessageStatus")
    public void updateMessageStatus(@Payload String messageId, Principal principal) {
        try {
            SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
            
            // Get updated message with attachments
            ChatMessageResponse updatedMessage = chatMessageService.getMessageById(messageId);
            
            // Broadcast updated message to channel
            messagingTemplate.convertAndSend(
                "/topic/channel/" + updatedMessage.getChannelId(), 
                updatedMessage
            );
            
        } catch (Exception e) {
            log.error("Failed to update message status", e);
        }
    }
}
