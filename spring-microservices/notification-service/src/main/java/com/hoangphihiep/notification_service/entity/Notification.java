package com.hoangphihiep.notification_service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientId;
    private String senderId;
    private String content; // Or JSON/Structure
    private String type; // INFO, WARNING, ASSIGNMENT, etc.
    private boolean isRead;
    private LocalDateTime createdAt;
    private String link; // Optional link to navigate
}
