package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChannelMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Section;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.model.enums.ChannelStatus;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.SectionRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetListUsersClient;
import demo.app.chat_app.repository.httpclient.GetStudentClient;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.utils.JwtUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelServiceImpl implements ChannelService {
    WorkspaceRepository workspaceRepository;
    SectionRepository sectionRepository;
    ChannelRepository channelRepository;
    ChannelMapper channelMapper;
    ChatMessageServiceImpl chatMessageService;
    GetUserClient getUserClient;
    GetListUsersClient getListUsersClient;
    GetStudentClient getStudentClient;

    public List<SectionResponse.Channel> getChannelsForSection(List<String> channelIds) {
        List<Channel> channels = channelRepository.findAllById(channelIds);
        return channels.stream()
                .map(channel -> SectionResponse.Channel.builder()
                        .id(channel.getId())
                        .channelName(channel.getChannelName())
                        .build())
                .toList();
    }

    public Channel createFirstChannelInSectionWhenStudentsEnrolled(ClassCreatedEvent event) {
        Workspace workspace = workspaceRepository.findByCourseId(event.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Channel channel = Channel.builder()
                .workspaceId(workspace.getId())
                .channelName(String.format("%s - %s",event.getClassName(), event.getClassCode()))
                .description("Đây là kênh chung dành cho lớp " + event.getClassName() +
                        ".\nGhi chú giáo viên: " + event.getDescription())
                .isPrivate(event.isPrivate())
                .createdAt(Instant.now())
                .memberIds(Collections.singletonList(workspace.getOwnerId()))
                .isGeneral(true)
                .build();
        return channelRepository.save(channel);
    }

    public void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event) {
        Section section = sectionRepository.findByClassId(event.getClassId())
                .stream()
                .filter(Section::isPublic)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        Workspace workspace = workspaceRepository.findById(section.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Channel generalChannelForSection = section.getChannelIds().stream()
                .map(channelId -> channelRepository.findById(channelId)
                        .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL)))
                .filter(Channel::isGeneral)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.GENERAL_CHANNEL_NOT_FOUND));

        generalChannelForSection.addMembers(event.getStudentIds());

        var savedChannelData = channelRepository.save(generalChannelForSection);
        workspace.addParticipants(savedChannelData.getMemberIds());
        workspaceRepository.save(workspace);
    }

    public Channel createGeneralChannel(String sectionId, List<String> members, Workspace workspace) {
        Workspace entity = workspaceRepository.findById(workspace.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));
        Channel channel = Channel.builder()
                .sectionId(sectionId)
                .workspaceId(entity.getId())
                .channelName("general")
                .description(String.format(
                        "Đây là kênh chung của môn học %s.\nMọi thắc mắc, trao đổi liên quan đến môn %s sẽ được thực hiện tại đây.",
                        entity.getName(), entity.getName()
                ))
                .memberIds(members)
                .isGeneral(true)
                .createdAt(Instant.now())
                .build();

        return channelRepository.save(channel);
    }

    @Override
    public BasicChannelResponse createChannel(ChannelCreationRequest request) {
        String userId = JwtUtils.getUserId();
        
        // Verify workspace exists and user has permission
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // Check if channel name already exists in workspace
        Optional<Channel> existingChannel = channelRepository
                .findByWorkspaceIdAndChannelName(request.getWorkspaceId(), request.getChannelName());
        if (existingChannel.isPresent()) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS);
        }

        Channel channel = Channel.builder()
                .workspaceId(request.getWorkspaceId())
                .sectionId(section.getId())
                .channelName(request.getChannelName())
                .description(request.getDescription())
                .memberIds(request.getMemberIds())
                .durationMinutes(request.getDurationInMinutes())
                .createdAt(Instant.now())
                .isPrivate(request.isPrivate())
                .build();

        channel = channelRepository.save(channel);

        // Add channel to workspace
        section.addChannelId(channel.getId());
        sectionRepository.save(section);

        return channelMapper.toBasicChannelResponse(channel);
    }

    @Override
    public ChannelResponse updateChannel(String id, ChannelCreationRequest request) {
        return null;
    }

    @Override
    public void deleteChannel(String id) {
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        channelRepository.delete(channel);
    }

    @Override
    public BasicChannelResponse getBasicChannelById(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        return BasicChannelResponse.builder()
                .id(channel.getId())
                .channelName(channel.getChannelName())
                .description(channel.getDescription())
                .participantHash(channel.getParticipantHash())
                .build();
    }

    @Override
    public List<BasicChannelResponse> getBasicChannels(String workspaceId) {
        String userId = JwtUtils.getUserId();

        // Verify workspace exists and user has access
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        if (!workspace.getOwnerId().equals(userId) && !workspace.hasParticipant(userId)) {
            throw new AppException(ErrorCode.INSUFFICIENT_PERMISSIONS);
        }

        // Get channels where user is participant (more efficient than loading all workspace channels)
        List<Channel> channels = channelRepository.findByWorkspaceId(workspaceId);


        List<BasicChannelResponse> channelsResponse = channels.stream()
                .map(channelMapper::toBasicChannelResponse)
                .toList();
        return channelsResponse;
    }

    @Override
    public ChannelResponse getChannelById(String id) {
        Channel channel = channelRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        ChannelResponse channelResponse = channelMapper.toResponse(channel);
        List<ChatMessageResponse> messages = chatMessageService.getMessages(channel.getId());
        channelResponse.setMessages(messages);
        return channelResponse;
    }

    @Override
    public List<ChannelResponse> getChannels(String workspaceId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify workspace exists and user has access
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));
                
        if (!workspace.getOwnerId().equals(userId) && !workspace.hasParticipant(userId)) {
            throw new AppException(ErrorCode.INSUFFICIENT_PERMISSIONS);
        }
        
        // Get channels where user is participant (more efficient than loading all workspace channels)
        List<Channel> channels = channelRepository.findByWorkspaceIdAndParticipantUserId(workspaceId, userId);

        List<ChannelResponse> channelResponse = channelMapper.toResponseList(channels);
        channelResponse.stream()
                .forEach(channel -> {
                    // Load messages for each channel
                    List<ChatMessageResponse> messages = chatMessageService.getMessages(channel.getId());
                    channel.setMessages(messages);
                });
        return channelResponse;
    }

    //
    public List<UserResponse> getMembersInChannel(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Workspace workspace = workspaceRepository.findById(channel.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        List<String> memberIds = channel.getMemberIds();
        List<StudentResponse> studentResponses = getStudentClient.getStudentsByUserIds(
                Map.of("userIds", memberIds)
        ).getResult();

        try {
            var ownerInfo = getUserClient.getUser(workspace.getOwnerId()).getResult();
            studentResponses.add(StudentResponse.builder()
                    .studentId(ownerInfo.getId())
                    .firstName(ownerInfo.getFirstName())
                    .lastName(ownerInfo.getLastName())
                    .build());
            var res = studentResponses.stream()
                    .map(studentResponse -> {
                        boolean isOwner = workspace.getOwnerId().equals(studentResponse.getStudentId());
                        return UserResponse.builder()
                                .id(studentResponse.getStudentId())
                                .firstName(studentResponse.getFirstName())
                                .lastName(studentResponse.getLastName())
                                .avatarUrl(studentResponse.getAvatarUrl())
                                .isOwner(isOwner)
                                .build();
                    }).toList();
            return res;
        } catch (Exception e) {
            throw new AppException(ErrorCode.GET_USER_PROFILE_FAILED);
        }

    }

    @Override
    public void submitPractices(String channelId) {

    }

    @Override
    public void softDeleteChannel(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));

        channel.setStatus(ChannelStatus.DELETED);
//        channel.setEndedAt(System.currentTimeMillis());

        channelRepository.save(channel);
    }

}
