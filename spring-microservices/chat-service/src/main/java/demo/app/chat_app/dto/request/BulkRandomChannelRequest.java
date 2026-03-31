package demo.app.chat_app.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BulkRandomChannelRequest {
    String sectionId;
    String workspaceId;
    String channelType;
    String channelName;
    String description;
    String endTime;
    boolean allowCrossReview;
    // For Group type
    int membersPerGroup;
}
