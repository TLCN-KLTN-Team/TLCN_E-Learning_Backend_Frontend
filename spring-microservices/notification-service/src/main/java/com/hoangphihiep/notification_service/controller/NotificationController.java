package com.hoangphihiep.notification_service.controller;

import com.hoangphihiep.notification_service.dto.EmailRequest;
import com.hoangphihiep.notification_service.dto.NotificationMessage;
import com.hoangphihiep.notification_service.entity.Notification;
import com.hoangphihiep.notification_service.service.EmailService;
import com.hoangphihiep.notification_service.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {

    private final SseService sseService;
    private final EmailService emailService;

    @GetMapping("/subscribe/{userId}")
    public SseEmitter subscribe(@PathVariable String userId) {
        return sseService.subscribe(userId);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(sseService.getUserNotifications(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markNotificationAsRead(
            @PathVariable String notificationId,
            @RequestParam String userId
    ) {
        return sseService.markNotificationAsRead(notificationId, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, Long>> markAllNotificationsAsRead(@PathVariable String userId) {
        long updated = sseService.markAllNotificationsAsRead(userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @PostMapping("/push")
    public ResponseEntity<String> pushNotification(@RequestBody NotificationMessage message) {
        sseService.sendNotification(message);
        return ResponseEntity.ok("Notification pushed if user is online.");
    }

    @PostMapping("/email/send")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequest request) {
        emailService.sendEmail(request);
        return ResponseEntity.ok("Email queued for sending.");
    }
}
