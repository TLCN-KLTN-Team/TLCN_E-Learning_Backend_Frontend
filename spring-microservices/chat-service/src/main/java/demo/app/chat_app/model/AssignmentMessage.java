package demo.app.chat_app.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "assignment_discussions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentMessage {
    
    @Id
    private String id;
    
    private Integer assignmentId;
    private String userId;
    private String userName;
    private String userAvatar;
    private String userRole; // STUDENT, TEACHER, ADMIN
    private String content;
    private String imageUrl; // Image attachment for message
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Builder.Default
    private Set<String> likedByUserIds = new HashSet<>();
    
    private String parentMessageId; // For threaded discussions
    
    @Builder.Default
    private Boolean isDeleted = false;
}
