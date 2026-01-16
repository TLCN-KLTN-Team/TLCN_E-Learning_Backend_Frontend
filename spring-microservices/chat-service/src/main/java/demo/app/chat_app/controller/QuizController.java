package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.DiscussionMessageRequest;
import demo.app.chat_app.dto.response.DiscussionMessageResponse;
import demo.app.chat_app.service.QuizDiscussionService;
import demo.app.chat_app.websocket.WebSocketAuthInterceptor;
import demo.app.chat_app.websocket.WebsocketSessionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for Quiz Discussion feature
 * Handles both REST API and WebSocket communication
 */
@Controller
@RestController
@RequestMapping("/api/discussions/quiz")
@RequiredArgsConstructor
@Slf4j
public class QuizController {
    
    private final QuizDiscussionService discussionService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all discussion messages for a quiz (REST)
     */
    @GetMapping("/{quizId}/messages")
    public ResponseEntity<Page<DiscussionMessageResponse>> getQuizDiscussion(
            @PathVariable Integer quizId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Fetching discussion for quiz: {}", quizId);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<DiscussionMessageResponse> messages = discussionService.getDiscussionMessages(quizId, pageRequest);
        return ResponseEntity.ok(messages);
    }

    /**
     * Post a new discussion message (REST)
     */
    @PostMapping("/{quizId}/messages")
    public ResponseEntity<DiscussionMessageResponse> postMessage(
            @PathVariable Integer quizId,
            @RequestBody DiscussionMessageRequest request) {
        
        log.info("Posting message to quiz discussion: {}", quizId);
        DiscussionMessageResponse response = discussionService.postMessage(quizId, request);
        
        // Broadcast to all subscribers
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + quizId + "/discussion",
            response
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Send message via WebSocket (Real-time)
     */
    @MessageMapping("/quiz/{quizId}/discussion")
    public void sendDiscussionMessage(
            @DestinationVariable Integer quizId,
            @Payload DiscussionMessageRequest request,
            SimpMessageHeaderAccessor accessor) {
        
        try {
            // Get userId from session
            String userId = WebsocketSessionUtil.getCurrentUserId(accessor);
            
            // Get token and set for Feign client
            String token = (String) accessor.getSessionAttributes().get("authToken");
            if (token != null) {
                WebSocketAuthInterceptor.setToken(token);
            }
            
            // Set authentication context
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(userId, null, null);
            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            
            log.info("Received discussion message for quiz: {} from user: {}", quizId, userId);
            
            // Save and send message
            DiscussionMessageResponse response = discussionService.postMessage(quizId, request);
            
            // Broadcast to all subscribers of this quiz discussion
            messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/discussion",
                response
            );
            
            log.info("Discussion message sent successfully: {}", response.getId());
            
        } catch (Exception e) {
            log.error("Failed to send discussion message", e);
            // Optionally send error to user
            messagingTemplate.convertAndSendToUser(
                accessor.getUser().getName(),
                "/queue/errors",
                "Failed to send message: " + e.getMessage()
            );
        } finally {
            WebSocketAuthInterceptor.clearToken();
        }
    }

    /**
     * Delete a discussion message
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        log.info("Deleting discussion message: {}", messageId);
        Integer quizId = discussionService.deleteMessage(messageId);
        
        // Notify all subscribers about deletion
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + quizId + "/discussion/delete",
            messageId
        );
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Like/Unlike a discussion message
     */
    @PostMapping("/messages/{messageId}/like")
    public ResponseEntity<DiscussionMessageResponse> toggleLike(@PathVariable String messageId) {
        log.info("Toggling like for message: {}", messageId);
        DiscussionMessageResponse response = discussionService.toggleLike(messageId);
        
        // Broadcast like update
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + response.getQuizId() + "/discussion/update",
            response
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get unread message count for a quiz
     */
    @GetMapping("/{quizId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Integer quizId) {
        log.info("Getting unread count for quiz: {}", quizId);
        Long count = discussionService.getUnreadCount(quizId);
        return ResponseEntity.ok(count);
    }

    /**
     * Mark discussion as read (for teacher/admin)
     */
    @PostMapping("/{quizId}/mark-read")
    public ResponseEntity<Void> markAsRead(@PathVariable Integer quizId) {
        log.info("Marking quiz discussion as read: {}", quizId);
        discussionService.markAsRead(quizId);
        return ResponseEntity.ok().build();
    }

    /**
     * Upload image for discussion message
     */
    @PostMapping("/upload-image")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(@RequestPart("file") MultipartFile file) {
        log.info("Uploading image for discussion: {}", file.getOriginalFilename());
        java.util.Map<String, String> result = discussionService.uploadImage(file);
        return ResponseEntity.ok(result);
    }
}
