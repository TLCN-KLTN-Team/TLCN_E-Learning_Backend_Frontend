package com.hoangphihiep.dto.request;

import lombok.*;

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
