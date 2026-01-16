package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedQuizMessage;
import demo.app.chat_app.service.PublishedCourseQuizDiscussionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/course-discussions/quiz")
@RequiredArgsConstructor
@Slf4j
public class QuizPublishedController {

    private final PublishedCourseQuizDiscussionService discussionService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all discussion messages for a published course quiz
     */
    @GetMapping("/{publishedCourseId}/{quizId}/messages")
    public ResponseEntity<Page<PublishedDiscussionMessageResponse>> getQuizDiscussion(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer quizId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("=== GET PUBLISHED COURSE QUIZ DISCUSSION: publishedCourseId={}, quizId={} ===", publishedCourseId, quizId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<PublishedDiscussionMessageResponse> messages = discussionService.getQuizDiscussion(publishedCourseId, quizId, pageable);
        
        return ResponseEntity.ok(messages);
    }

    /**
     * Post a new discussion message
     */
    @PostMapping("/{publishedCourseId}/{quizId}/messages")
    public ResponseEntity<PublishedDiscussionMessageResponse> postMessage(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer quizId,
            @RequestBody PublishedDiscussionMessageRequest request
    ) {
        log.info("=== POST PUBLISHED COURSE QUIZ MESSAGE: publishedCourseId={}, quizId={} ===", publishedCourseId, quizId);
        
        PublishedDiscussionMessageResponse message = discussionService.postMessage(publishedCourseId, quizId, request);
        
        // Broadcast to WebSocket subscribers
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "NEW_MESSAGE");
        wsMessage.put("message", message);
        messagingTemplate.convertAndSend(
            "/topic/course/quiz/" + publishedCourseId + "/" + quizId + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(message);
    }

    /**
     * Delete a discussion message
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable String messageId) {
        log.info("=== DELETE PUBLISHED COURSE QUIZ MESSAGE: {} ===", messageId);
        
        // Get message before deleting to know which topic to broadcast to
        PublishedQuizMessage message = discussionService.getMessageById(messageId);
        
        discussionService.deleteMessage(messageId);
        
        // Broadcast delete event to WebSocket subscribers
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "DELETE_MESSAGE");
        wsMessage.put("messageId", messageId);
        messagingTemplate.convertAndSend(
            "/topic/course/quiz/" + message.getPublishedCourseId() + "/" + message.getQuizId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Message deleted successfully")
                .build());
    }

    /**
     * Toggle like on a message
     */
    @PostMapping("/messages/{messageId}/like")
    public ResponseEntity<PublishedDiscussionMessageResponse> toggleLike(@PathVariable String messageId) {
        log.info("=== TOGGLE LIKE PUBLISHED COURSE QUIZ MESSAGE: {} ===", messageId);
        
        PublishedDiscussionMessageResponse message = discussionService.toggleLike(messageId);
        
        // Broadcast like update to WebSocket subscribers
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "UPDATE_MESSAGE");
        wsMessage.put("message", message);
        messagingTemplate.convertAndSend(
            "/topic/course/quiz/" + message.getPublishedCourseId() + "/" + message.getQuizId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(message);
    }

    /**
     * Get unread message count
     */
    @GetMapping("/{publishedCourseId}/{quizId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer quizId
    ) {
        log.info("=== GET UNREAD COUNT: publishedCourseId={}, quizId={} ===", publishedCourseId, quizId);
        
        Long count = discussionService.getUnreadCount(publishedCourseId, quizId);
        
        return ResponseEntity.ok(count);
    }

    /**
     * Get unread counts for all quizzes in a published course
     */
    @GetMapping("/{publishedCourseId}/batch-unread-counts")
    public ResponseEntity<Map<Integer, Long>> getBatchUnreadCounts(
            @PathVariable Integer publishedCourseId,
            @RequestParam List<Integer> quizIds
    ) {
        log.info("=== GET BATCH UNREAD COUNTS: publishedCourseId={}, quizIds={} ===", publishedCourseId, quizIds);
        
        Map<Integer, Long> counts = discussionService.getBatchUnreadCounts(publishedCourseId, quizIds);
        
        return ResponseEntity.ok(counts);
    }

    /**
     * Mark discussion as read
     */
    @PostMapping("/{publishedCourseId}/{quizId}/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer quizId
    ) {
        log.info("=== MARK AS READ: publishedCourseId={}, quizId={} ===", publishedCourseId, quizId);
        
        discussionService.markAsRead(publishedCourseId, quizId);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Marked as read")
                .build());
    }

    /**
     * WebSocket endpoint for posting messages
     */
    @MessageMapping("/course/quiz/{publishedCourseId}/{quizId}/discussion")
    @SendTo("/topic/course/quiz/{publishedCourseId}/{quizId}/discussion")
    public Map<String, Object> handleWebSocketMessage(
            @DestinationVariable Integer publishedCourseId,
            @DestinationVariable Integer quizId,
            @Payload PublishedDiscussionMessageRequest request
    ) {
        log.info("=== WEBSOCKET MESSAGE: publishedCourseId={}, quizId={} ===", publishedCourseId, quizId);
        
        PublishedDiscussionMessageResponse message = discussionService.postMessage(publishedCourseId, quizId, request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "NEW_MESSAGE");
        response.put("message", message);
        
        return response;
    }
}
