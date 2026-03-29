package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.workspace.ChannelType;
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

    private String endTime; // ISO 8601 format, e.g. "2024-12-31T23:59:59Z"
}
