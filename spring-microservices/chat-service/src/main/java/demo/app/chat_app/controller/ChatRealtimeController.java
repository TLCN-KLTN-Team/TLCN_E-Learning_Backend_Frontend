package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.ChatMessageResponse;
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

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatRealtimeController {
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest request,
                           SimpMessageHeaderAccessor headerAccessor,
                           Principal principal) {
        try {
            log.info("Received message content: {}", request.getContent());
            SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
            
            // Process and save message
            ChatMessageResponse response = chatMessageService.createMessage(request, principal);
            
            // Send to channel subscribers
            messagingTemplate.convertAndSend("/topic/channel." + request.getChannelId(), response);
            
            // Send to direct message recipients if it's a DM
            if (request.getRecipientId() != null) {
                messagingTemplate.convertAndSendToUser(
                    request.getRecipientId(), 
                    "/queue/messages", 
                    response
                );
            }
            
            log.info("Message sent successfully: {}", response.getId());
            
        } catch (Exception e) {
            log.error("Error processing message", e);
            // Send error back to sender
            messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/errors",
                "Failed to send message: " + e.getMessage()
            );
        }
    }


    @MessageMapping("/chat.addUser")
    public void addUser(@Payload String username,
                       SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", username);
        log.info("User {} connected", username);
    }

    @MessageMapping("/join")
    public void joinChannel(String channelId, Principal principal){
        SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
    }

    @MessageMapping("/leave")
    public void leaveChannel(String channelId, Principal principal) {
        // Logic to handle user leaving a channel if needed
        log.info("User {} left channel {}", principal.getName(), channelId);
        SecurityContextHolder.getContext().setAuthentication((Authentication) principal);
    }
}
