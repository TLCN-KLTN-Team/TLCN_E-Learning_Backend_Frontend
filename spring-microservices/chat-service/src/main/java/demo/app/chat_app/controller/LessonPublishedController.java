package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedLessonMessage;
import demo.app.chat_app.service.PublishedCourseLessonDiscussionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/course-discussions/lesson")
@RequiredArgsConstructor
public class LessonPublishedController {

    private final PublishedCourseLessonDiscussionService lessonDiscussionService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{publishedCourseId}/{lessonId}")
    public ResponseEntity<Page<PublishedDiscussionMessageResponse>> getLessonDiscussion(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer lessonId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(lessonDiscussionService.getLessonDiscussion(publishedCourseId, lessonId, page, size));
    }

    @PostMapping("/{publishedCourseId}/{lessonId}/messages")
    public ResponseEntity<PublishedDiscussionMessageResponse> postMessage(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer lessonId,
            @RequestBody PublishedDiscussionMessageRequest request) {
        PublishedDiscussionMessageResponse response = lessonDiscussionService.postMessage(publishedCourseId, lessonId, request);
        
        // Broadcast to WebSocket subscribers
        messagingTemplate.convertAndSend(
            "/topic/course/lesson/" + publishedCourseId + "/" + lessonId + "/discussion",
            response
        );
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        PublishedLessonMessage message = lessonDiscussionService.getMessageById(messageId);
        lessonDiscussionService.deleteMessage(messageId);
        
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "DELETE_MESSAGE");
        wsMessage.put("messageId", messageId);
        messagingTemplate.convertAndSend(
            "/topic/course/lesson/" + message.getPublishedCourseId() + "/" + message.getLessonId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/messages/{messageId}/like")
    public ResponseEntity<PublishedDiscussionMessageResponse> toggleLike(@PathVariable String messageId) {
        PublishedDiscussionMessageResponse message = lessonDiscussionService.toggleLike(messageId);
        
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "UPDATE_MESSAGE");
        wsMessage.put("message", message);
        messagingTemplate.convertAndSend(
            "/topic/course/lesson/" + message.getPublishedCourseId() + "/" + message.getLessonId() + "/discussion",
            wsMessage
        );
        
        return ResponseEntity.ok(message);
    }

    @GetMapping("/{publishedCourseId}/{lessonId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer lessonId) {
        return ResponseEntity.ok(lessonDiscussionService.getUnreadCount(publishedCourseId, lessonId));
    }

    /**
     * Get unread counts for all lessons in a published course
     */
    @GetMapping("/{publishedCourseId}/batch-unread-counts")
    public ResponseEntity<Map<Integer, Long>> getBatchUnreadCounts(
            @PathVariable Integer publishedCourseId,
            @RequestParam List<Integer> lessonIds
    ) {
        
        Map<Integer, Long> counts = lessonDiscussionService.getBatchUnreadCounts(publishedCourseId, lessonIds);
        
        return ResponseEntity.ok(counts);
    }

    @PostMapping("/{publishedCourseId}/{lessonId}/mark-read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Integer publishedCourseId,
            @PathVariable Integer lessonId) {
        lessonDiscussionService.markAsRead(publishedCourseId, lessonId);
        return ResponseEntity.ok().build();
    }

    // WebSocket endpoint
    @MessageMapping("/course/lesson/{publishedCourseId}/{lessonId}/discussion")
    public void handleLessonDiscussion(
            @DestinationVariable Integer publishedCourseId,
            @DestinationVariable Integer lessonId,
            @Payload PublishedDiscussionMessageRequest request) {
        PublishedDiscussionMessageResponse response = lessonDiscussionService.postMessage(publishedCourseId, lessonId, request);
        messagingTemplate.convertAndSend(
            "/topic/course/lesson/" + publishedCourseId + "/" + lessonId + "/discussion",
            response
        );
    }
}
