package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.DiscussionMessageRequest;
import demo.app.chat_app.dto.response.DiscussionMessageResponse;
import demo.app.chat_app.service.LessonDiscussionService;
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
 * Controller for Lesson Discussion feature
 * Handles both REST API and WebSocket communication
 */
@Controller
@RestController
@RequestMapping("/api/discussions/lesson")
@RequiredArgsConstructor
@Slf4j
public class LessonController {
    
    private final LessonDiscussionService discussionService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all discussion messages for a lesson (REST)
     */
    @GetMapping("/{lessonId}/messages")
    public ResponseEntity<Page<DiscussionMessageResponse>> getLessonDiscussion(
            @PathVariable Integer lessonId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Fetching discussion for lesson: {}", lessonId);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<DiscussionMessageResponse> messages = discussionService.getDiscussionMessages(lessonId, pageRequest);
        return ResponseEntity.ok(messages);
    }

    /**
     * Post a new discussion message (REST)
     */
    @PostMapping("/{lessonId}/messages")
    public ResponseEntity<DiscussionMessageResponse> postMessage(
            @PathVariable Integer lessonId,
            @RequestBody DiscussionMessageRequest request) {
        
        log.info("Posting message to lesson discussion: {}", lessonId);
        DiscussionMessageResponse response = discussionService.postMessage(lessonId, request);
        
        // Broadcast to all subscribers
        messagingTemplate.convertAndSend(
            "/topic/lesson/" + lessonId + "/discussion",
            response
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Send message via WebSocket (Real-time)
     */
    @MessageMapping("/lesson/{lessonId}/discussion")
    public void sendDiscussionMessage(
            @DestinationVariable Integer lessonId,
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
            
            log.info("Received discussion message for lesson: {} from user: {}", lessonId, userId);
            
            // Save and send message
            DiscussionMessageResponse response = discussionService.postMessage(lessonId, request);
            
            // Broadcast to all subscribers of this lesson discussion
            messagingTemplate.convertAndSend(
                "/topic/lesson/" + lessonId + "/discussion",
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
        Integer lessonId = discussionService.deleteMessage(messageId);
        
        // Notify all subscribers about deletion
        messagingTemplate.convertAndSend(
            "/topic/lesson/" + lessonId + "/discussion/delete",
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
            "/topic/lesson/" + response.getLessonId() + "/discussion/update",
            response
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get unread message count for a lesson
     */
    @GetMapping("/{lessonId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Integer lessonId) {
        log.info("Getting unread count for lesson: {}", lessonId);
        Long count = discussionService.getUnreadCount(lessonId);
        return ResponseEntity.ok(count);
    }

    /**
     * Mark discussion as read
     */
    @PostMapping("/{lessonId}/mark-read")
    public ResponseEntity<Void> markAsRead(@PathVariable Integer lessonId) {
        log.info("Marking lesson discussion as read: {}", lessonId);
        discussionService.markAsRead(lessonId);
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
