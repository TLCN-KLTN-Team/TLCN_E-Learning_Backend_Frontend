package com.hoangphihiep.notification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String userId;
    private String senderId;
    private String type;
    private String message;
    private String link;
    private Object data;
}
