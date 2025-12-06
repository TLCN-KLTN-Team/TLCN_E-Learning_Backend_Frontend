package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.CreateGroupRequest;
import demo.app.chat_app.dto.response.CreateGroupResponse;
import demo.app.chat_app.dto.response.GroupResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Group;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.GroupRepository;
import demo.app.chat_app.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl {
    private final GroupRepository groupRepository;
    private final ChannelRepository channelRepository;
    private final ChatMessageRepository chatMessageRepository;

//    @PreAuthorize("hasRole('TEACHER')")
    public List<CreateGroupResponse> getAllGroupsByChannelId(String channelId) {
        List<Group> groups = groupRepository.findByChannelId((channelId));
        return groups.stream().map(group -> CreateGroupResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .build()).toList();
    }

    public List<CreateGroupResponse> getEnableGroupsByChannelId(String channelId) {
        List<Group> groups = groupRepository.findByChannelId((channelId));
        return groups.stream()
                .filter(group -> !group.isDeleted())
                .map(group -> CreateGroupResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .build()).toList();
    }

    public GroupResponse getGroupById(String groupId) {
        String userId = JwtUtils.getUserId();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_GROUP));
        return GroupResponse.builder()
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .build();
    }


    public CreateGroupResponse createdGroup(CreateGroupRequest request) {
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Group group = Group.builder()
                .groupName(request.getGroupName())
                .description(request.getDescription())
                .channelId(channel.getId())
                .createdAt(Instant.now())
                .build();
        Group savedGroup = groupRepository.save(group);
        return CreateGroupResponse.builder()
                .groupId(savedGroup.getId())
                .groupName(savedGroup.getGroupName())
                .build();
    }

    public void disableGroup(String groupId){
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_GROUP));
        group.setDeleted(true);
        groupRepository.save(group);
    }

}
