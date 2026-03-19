package com.hoangphihiep.notification_service.service;

import com.hoangphihiep.notification_service.dto.NotificationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import com.hoangphihiep.notification_service.entity.Notification;
import com.hoangphihiep.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class SseService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final NotificationRepository notificationRepository;

    public SseEmitter subscribe(String userId) {
        // Timeout 1 hour
        SseEmitter emitter = new SseEmitter(3600000L);
        
        emitters.put(userId, emitter);
        
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        // Send creating event
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        log.info("User {} subscribed to SSE", userId);
        return emitter;
    }

    public void sendNotification(NotificationMessage message) {
        String userId = message.getUserId();
        if (userId == null) return;

        // Save to Database
        Notification notification = Notification.builder()
                .recipientId(userId)
                .senderId(message.getSenderId())
                .content(message.getMessage())
                .type(message.getType())
                .link(message.getLink())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);

        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(message.getType() != null ? message.getType() : "NOTIFICATION")
                        .data(message));
                log.info("Sent notification to user {}", userId);
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Notification> markNotificationAsRead(String notificationId, String userId) {
        Optional<Notification> notificationOptional = notificationRepository.findByIdAndRecipientId(notificationId, userId);
        if (notificationOptional.isEmpty()) {
            return Optional.empty();
        }

        Notification notification = notificationOptional.get();
        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }

        return Optional.of(notification);
    }

    public long markAllNotificationsAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByRecipientIdAndIsReadFalse(userId);
        if (unreadNotifications.isEmpty()) {
            return 0;
        }

        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        return unreadNotifications.size();
    }
}
