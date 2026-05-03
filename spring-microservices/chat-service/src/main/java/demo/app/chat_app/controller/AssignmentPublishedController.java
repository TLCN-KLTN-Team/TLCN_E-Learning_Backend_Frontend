package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedAssignmentMessage;
import demo.app.chat_app.service.PublishedCourseAssignmentDiscussionService;
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
@RequestMapping("/course-discussions/assignment")
@RequiredArgsConstructor
@Slf4j
public class AssignmentPublishedController {

    private final PublishedCourseAssignmentDiscussionService discussionService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{publishedCourseId}/{assignmentId}/messages")
    public ResponseEntity<Page<PublishedDiscussionMessageResponse>> getAssignmentDiscussion(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer assignmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("=== GET PUBLISHED COURSE ASSIGNMENT DISCUSSION: publishedCourseId={}, assignmentId={} ===", publishedCourseId, assignmentId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<PublishedDiscussionMessageResponse> messages = discussionService.getAssignmentDiscussion(publishedCourseId, assignmentId, pageable);
        
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{publishedCourseId}/{assignmentId}/messages")
    public ResponseEntity<PublishedDiscussionMessageResponse> postMessage(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer assignmentId,
            @RequestBody PublishedDiscussionMessageRequest request
    ) {
        log.info("=== POST PUBLISHED COURSE ASSIGNMENT MESSAGE: publishedCourseId={}, assignmentId={} ===", publishedCourseId, assignmentId);
        
        PublishedDiscussionMessageResponse message = discussionService.postMessage(publishedCourseId, assignmentId, request);
        
        // Broadcast to WebSocket subscribers
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "NEW_MESSAGE");
        wsMessage.put("message", message);
        messagingTemplate.convertAndSend(
            "/topic/course/assignment/" + publishedCourseId + "/" + assignmentId + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable String messageId) {
        log.info("=== DELETE PUBLISHED COURSE ASSIGNMENT MESSAGE: {} ===", messageId);
        
        PublishedAssignmentMessage message = discussionService.getMessageById(messageId);
        discussionService.deleteMessage(messageId);
        
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "DELETE_MESSAGE");
        wsMessage.put("messageId", messageId);
        messagingTemplate.convertAndSend(
            "/topic/course/assignment/" + message.getPublishedCourseId() + "/" + message.getAssignmentId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Message deleted successfully")
                .build());
    }

    @PostMapping("/messages/{messageId}/like")
    public ResponseEntity<PublishedDiscussionMessageResponse> toggleLike(@PathVariable String messageId) {
        log.info("=== TOGGLE LIKE PUBLISHED COURSE ASSIGNMENT MESSAGE: {} ===", messageId);
        
        PublishedDiscussionMessageResponse message = discussionService.toggleLike(messageId);
        
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "UPDATE_MESSAGE");
        wsMessage.put("message", message);
        messagingTemplate.convertAndSend(
            "/topic/course/assignment/" + message.getPublishedCourseId() + "/" + message.getAssignmentId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(message);
    }

    @GetMapping("/{publishedCourseId}/{assignmentId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer assignmentId
    ) {
        log.info("=== GET UNREAD COUNT: publishedCourseId={}, assignmentId={} ===", publishedCourseId, assignmentId);
        
        Long count = discussionService.getUnreadCount(publishedCourseId, assignmentId);
        
        return ResponseEntity.ok(count);
    }

    @GetMapping("/{publishedCourseId}/batch-unread-counts")
    public ResponseEntity<Map<Integer, Long>> getBatchUnreadCounts(
            @PathVariable Integer publishedCourseId,
            @RequestParam List<Integer> assignmentIds
    ) {
        log.info("=== GET BATCH UNREAD COUNTS: publishedCourseId={}, assignmentIds={} ===", publishedCourseId, assignmentIds);
        
        Map<Integer, Long> counts = discussionService.getBatchUnreadCounts(publishedCourseId, assignmentIds);
        
        return ResponseEntity.ok(counts);
    }

    @PostMapping("/{publishedCourseId}/{assignmentId}/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer assignmentId
    ) {
        log.info("=== MARK AS READ: publishedCourseId={}, assignmentId={} ===", publishedCourseId, assignmentId);
        
        discussionService.markAsRead(publishedCourseId, assignmentId);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Marked as read")
                .build());
    }

    @MessageMapping("/course/assignment/{publishedCourseId}/{assignmentId}/discussion")
    @SendTo("/topic/course/assignment/{publishedCourseId}/{assignmentId}/discussion")
    public Map<String, Object> handleWebSocketMessage(
            @DestinationVariable Integer publishedCourseId,
            @DestinationVariable Integer assignmentId,
            @Payload PublishedDiscussionMessageRequest request
    ) {
        log.info("=== WEBSOCKET MESSAGE: publishedCourseId={}, assignmentId={} ===", publishedCourseId, assignmentId);
        
        PublishedDiscussionMessageResponse message = discussionService.postMessage(publishedCourseId, assignmentId, request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "NEW_MESSAGE");
        response.put("message", message);
        
        return response;
    }
}
