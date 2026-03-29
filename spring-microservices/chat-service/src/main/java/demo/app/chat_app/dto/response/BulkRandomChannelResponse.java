package demo.app.chat_app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkRandomChannelResponse {

    private List<BasicChannelResponse> channels;

}
