package demo.app.chat_app.model.forum;

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
@Document(collection = "forum_categories")
public class Category {
    @Id
    private String id;
    private String name;
    private String description;
    private String icon; // URL or icon code
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
