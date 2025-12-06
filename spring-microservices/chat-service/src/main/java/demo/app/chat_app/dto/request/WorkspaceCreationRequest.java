package demo.app.chat_app.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkspaceCreationRequest {
    String name; // Name of the workspace
    String description; // Description of the workspace
    String avatarUrl; // URL to the workspace avatar image
    String courseId; // ID of the course associated with the workspace
    List<String> memberIds; // List of participants in the workspace
    boolean isPublic;
}
