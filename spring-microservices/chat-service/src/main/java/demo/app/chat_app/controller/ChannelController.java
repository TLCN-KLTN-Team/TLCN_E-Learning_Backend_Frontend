package demo.app.chat_app.controller;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.service.ChannelService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/channels")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelController {
    ChannelService channelService;

    @GetMapping("/{channelId}")
    public ApiResponse<ChannelResponse> getChannel(@PathVariable String channelId) {
        ChannelResponse response = channelService.getChannelById(channelId);
        return ApiResponse.<ChannelResponse>builder()
                .result(response)
                .message("Channel retrieved successfully")
                .build();
    }

    @GetMapping("/workspace/{workspaceId}")
    public ApiResponse<List<ChannelResponse>> getChannelsByWorkspace(@PathVariable String workspaceId) {
        List<ChannelResponse> channels = channelService.getChannels(workspaceId);
        return ApiResponse.<List<ChannelResponse>>builder()
                .result(channels)
                .message("Channels retrieved successfully")
                .build();
    }
}
