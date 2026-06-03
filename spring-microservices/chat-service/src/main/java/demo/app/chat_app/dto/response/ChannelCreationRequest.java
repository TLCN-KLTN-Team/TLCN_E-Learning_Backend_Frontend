package demo.app.chat_app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChannelCreationRequest {
    private String sectionId;
    private String scope;
    private String channelName;
    private String description;
    private String channelType;

    private List<String> memberIds;

    /**
     * Hạn nộp bài (ISO-8601). Bắt buộc với GROUP làm bài tập.
     */
    private String submissionDeadline;

    /**
     * Hạn chấm chéo (ISO-8601). Bắt buộc khi allowCrossReview=true.
     */
    private String crossReviewDeadline;

    private boolean allowCrossReview;

    /**
     * ID của AssignmentSession nếu channel này được tạo từ bulk-random.
     * Null khi tạo kênh thủ công.
     */
    private String assignmentSessionId;
}
