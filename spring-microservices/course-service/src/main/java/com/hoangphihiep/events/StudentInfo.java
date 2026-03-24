package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified student info for Kafka events
 * Chứa thông tin cần thiết để chat-service tạo ChannelMember
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentInfo {
    private String userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String studentId;
}
