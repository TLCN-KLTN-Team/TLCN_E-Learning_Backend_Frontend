package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.UserProfileResponse;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChannelMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Participant;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.model.enums.ChannelStatus;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetListUsersClient;
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
    ChannelRepository channelRepository;
    ChannelMapper channelMapper;
    ChatMessageService chatMessageService;
    private final GetUserClient getUserClient;
    private final GetListUsersClient getListUsersClient;

    public void createChannelWhenStudentsEnrolled(ClassCreatedEvent event) {
        Workspace workspace = workspaceRepository.findByCourseId(event.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Participant owner = workspace.getMembers().stream()
                .filter(participant -> participant.getUserId().equals(workspace.getOwnerId()))
                .findFirst().orElse(null);

        Channel channel = Channel.builder()
                .channelName(event.getClassName())
                .description(event.getDescription())
                .classId(event.getClassId())
                .isPrivate(event.isPrivate())
                .createdAt(Instant.now())
                .workspaceId(workspace.getId())
                .participants(Collections.singletonList(owner))
                .build();
        channelRepository.save(channel);

    }

    public void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event) {
        Channel channel = channelRepository.findByClassId(event.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Workspace workspace = workspaceRepository.findById(channel.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        channel.addParticipants(event.getStudents().stream()
                .map(student -> Participant.builder()
                        .userId(student.getStudentId())
                        .firstName(student.getFirstName())
                        .lastName(student.getLastName())
                        .mssv(student.getMssv())
                        .joinedAt(Instant.now())
                        .build()
                )
                .toList()
        );

        var savedChannelData = channelRepository.save(channel);
        workspace.addMembers(savedChannelData.getParticipants());
        workspaceRepository.save(workspace);
    }

    @Override
    public BasicChannelResponse createChannel(ChannelCreationRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify workspace exists and user has permission
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        // Check if channel name already exists in workspace
        Optional<Channel> existingChannel = channelRepository
                .findByWorkspaceIdAndChannelName(request.getWorkspaceId(), request.getName());
        if (existingChannel.isPresent()) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS);
        }

        List<Participant> participants = new ArrayList<>();

        request.getMemberIds().stream()
                .forEach(memberId -> {
                    UserProfileResponse user = getUserClient.getUser(memberId).getResult();
                    if (user == null) {
                        throw new AppException(ErrorCode.USER_NOT_EXISTED);
                    }
                    participants.add(toParticipant(user));
                });
        Participant creator = toParticipant(getUserClient.getUser(userId).getResult());
        participants.add(creator);

        Channel channel = Channel.builder()
                .channelName(request.getName())
                .description(request.getDescription())
                .workspaceId(request.getWorkspaceId())
                .participants(participants)
                .createdAt(Instant.now())
                .isPrivate(request.isPrivate())
                .build();

        channel = channelRepository.save(channel);

        // Add channel to workspace
        workspace.addChannel(channel.getId());
        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);

        return channelMapper.toBasicChannelResponse(channel);
    }

    private Participant toParticipant(UserProfileResponse user) {
        return Participant.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .mssv(user.getMssv())
                .avatarUrl(user.getAvatar())
                .build();
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

        if (!workspace.getOwnerId().equals(userId) && !workspace.hasMember(userId)) {
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
                
        if (!workspace.getOwnerId().equals(userId) && !workspace.hasMember(userId)) {
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

    @Override
    public void submitPractices(String channelId) {

    }

    @Override
    public void softDeleteChannel(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));

        channel.setStatus(ChannelStatus.ENDED);
//        channel.setEndedAt(System.currentTimeMillis());

        channelRepository.save(channel);
    }

    public void deleteChannelById(String id){
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        channelRepository.delete(channel);
    }
}
