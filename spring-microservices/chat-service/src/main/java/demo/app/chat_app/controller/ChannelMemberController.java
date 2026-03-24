package demo.app.chat_app.controller;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.service.ChannelMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/channel-members")
@RequiredArgsConstructor
public class ChannelMemberController {

    private final ChannelMemberService channelMemberService;

    @GetMapping("{channelId}")
    public ApiResponse<?> getActiveChannelMemberInChannel(@PathVariable String channelId) {
        return ApiResponse.builder()
                .result(channelMemberService.getActiveMembersInChannel(channelId))
                .message("Active channel members retrieved successfully")
                .build();
    }

}
