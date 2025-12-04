package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.CreateGroupRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.service.impl.GroupServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/groups")
public class GroupController {
    private final GroupServiceImpl groupService;

    @GetMapping("/{channelId}")
    public ApiResponse<?> getGroups(@PathVariable String channelId) {
        return ApiResponse.builder()
                .result(groupService.getAllGroupsByChannelId(channelId))
                .message("Groups retrieved successfully")
                .build();
    }

    @GetMapping("/members/{channelId}")
    public ApiResponse<?> getMembersByKeyword(@PathVariable String channelId,
                                              @RequestParam String keyword) {
        return ApiResponse.builder()
                .result(groupService.getMembersInChannelByMssv(channelId, keyword))
                .message("Members retrieved successfully")
                .build();
    }

    @PostMapping
    public ApiResponse<?> createGroup(@RequestBody CreateGroupRequest request) {
        return ApiResponse.builder()
                .result(groupService.createdGroup(request))
                .message("Group created successfully")
                .build();
    }
}
