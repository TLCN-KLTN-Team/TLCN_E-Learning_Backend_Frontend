package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.impl.ChannelServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/channels")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelController {
    ChannelServiceImpl channelService;

    @GetMapping("/{channelId}")
    public ApiResponse<ChannelResponse> getChannel(@PathVariable String channelId) {
        ChannelResponse response = channelService.getChannelById(channelId);
        return ApiResponse.<ChannelResponse>builder()
                .result(response)
                .message("Channel retrieved successfully")
                .build();
    }

    @GetMapping("/basic/{sectionId}")
    public ApiResponse<List<BasicChannelResponse>> getBasicChannelsByWorkspace(@PathVariable String sectionId) {
        List<BasicChannelResponse> channels = channelService.getBasicChannels(sectionId);
        return ApiResponse.<List<BasicChannelResponse>>builder()
                .result(channels)
                .message("Basic channels retrieved successfully")
                .build();
    }

    @GetMapping("/section/{sectionId}")
    public ApiResponse<List<ChannelResponse>> getChannelsByWorkspace(@PathVariable String sectionId) {
        List<ChannelResponse> channels = channelService.getChannels(sectionId);
        return ApiResponse.<List<ChannelResponse>>builder()
                .result(channels)
                .message("Channels retrieved successfully")
                .build();
    }

    @GetMapping("/members/{channelId}")
    public ApiResponse<List<UserResponse>> getMembersInChannel(@PathVariable String channelId) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(channelService.getMembersInChannel(channelId))
                .message("Channel members retrieved successfully")
                .build();
    }

    @PostMapping("/create")
    public ApiResponse<BasicChannelResponse> createChannel(@RequestBody ChannelCreationRequest request){
        try{
            BasicChannelResponse channelResponse = channelService.createChannel(request);
            return ApiResponse.<BasicChannelResponse>builder()
                    .result(channelResponse)
                    .message("Channel created successfully")
                    .build();
        }catch (Exception e){
            return ApiResponse.<BasicChannelResponse>builder()
                    .message("Failed to create channel: " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/update/{channelId}")
    public ApiResponse<ChannelResponse> updateChannel(@RequestBody ChannelCreationRequest request,
                                                      @PathVariable String channelId){
        try{
            ChannelResponse channelResponse = channelService.updateChannel(channelId, request);
            return ApiResponse.<ChannelResponse>builder()
                    .result(channelResponse)
                    .message("Channel updated successfully")
                    .build();
        }catch (Exception e){
            return ApiResponse.<ChannelResponse>builder()
                    .message("Failed to update channel: " + e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/delete/{channelId}")
    public ApiResponse<Void> deleteChannel(@PathVariable String channelId) {
        try {
            channelService.deleteChannel(channelId);
            return ApiResponse.<Void>builder()
                    .message("Channel deleted successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.<Void>builder()
                    .message("Failed to delete channel: " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/submit/{channelId}")
    public ApiResponse<Void> endChannel(@PathVariable String channelId) {
        try {
            return ApiResponse.<Void>builder()
                    .message("Channel ended successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.<Void>builder()
                    .message("Failed to end channel: " + e.getMessage())
                    .build();
        }
    }
}
