package demo.app.chat_app.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

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

    /**
     * Hạn nộp bài (ISO-8601). Bắt buộc.
     */
    String submissionDeadline;

    /**
     * Hạn chấm chéo (ISO-8601). Bắt buộc khi allowCrossReview=true,
     * phải > submissionDeadline + 1h. Bỏ qua khi allowCrossReview=false.
     */
    String crossReviewDeadline;

    boolean allowCrossReview;

    // For Group type
    int membersPerGroup;
}
