package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChannelMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.ChatMessageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelServiceImpl implements ChannelService {
    WorkspaceRepository workspaceRepository;
    ChannelRepository channelRepository;
    ChannelMapper channelMapper;
    ChatMessageService chatMessageService;

    @Override
    public ChannelResponse createChannel(ChannelCreationRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify workspace exists and user has permission
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));
                
        // Check if user is owner or member of workspace
        if (!workspace.getOwnerId().equals(userId) && !workspace.hasMember(userId)) {
            throw new AppException(ErrorCode.INSUFFICIENT_PERMISSIONS);
        }

        // Check if channel name already exists in workspace
        Optional<Channel> existingChannel = channelRepository
                .findByWorkspaceIdAndChannelName(request.getWorkspaceId(), request.getName());
        if (existingChannel.isPresent()) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS);
        }

        Channel channel = Channel.builder()
                .channelName(request.getName())
                .description(request.getDescription())
                .workspaceId(request.getWorkspaceId())
                .participants(workspace.getMembers()) // Initialize with all workspace members
                .createdAt(Instant.now())
                .build();

        channel = channelRepository.save(channel);

        // Add channel to workspace
        workspace.addChannel(channel.getId());
        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);

        return channelMapper.toResponse(channel);
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
                .participantHash(channel.getParticipantHash())
                .build();
    }

    @Override
    public List<BasicChannelResponse> getBasicChannels(String workspaceId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Verify workspace exists and user has access
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        if (!workspace.getOwnerId().equals(userId) && !workspace.hasMember(userId)) {
            throw new AppException(ErrorCode.INSUFFICIENT_PERMISSIONS);
        }

        // Get channels where user is participant (more efficient than loading all workspace channels)
        List<Channel> channels = channelRepository.findByWorkspaceIdAndParticipantUserId(workspaceId, userId);


        List<BasicChannelResponse> channelResponse = channels.stream()
                .map(channelMapper::toBasicChannelResponse)
                .toList();
        return channelResponse;
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
}
