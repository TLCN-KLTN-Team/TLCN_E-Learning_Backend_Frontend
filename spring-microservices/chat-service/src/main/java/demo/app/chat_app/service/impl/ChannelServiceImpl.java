package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChannelMapper;
import demo.app.chat_app.model.workspace.*;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.SectionRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetStudentClient;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.ChannelService;
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
    GetStudentClient getStudentClient;

    public List<SectionResponse.Channel> getChannelsForSection(List<String> channelIds) {
        List<Channel> channels = channelRepository.findAllById(channelIds);
        return channels.stream()
                .map(channel -> SectionResponse.Channel.builder()
                        .id(channel.getId())
                        .name(channel.getName())
                        .build())
                .toList();
    }

    public Channel createFirstChannelInSectionWhenStudentsEnrolled(ClassCreatedEvent event) {
        Section section = sectionRepository.findByClassId(event.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
        Workspace workspace = workspaceRepository.findById(section.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        String channelName = String.format("%s - %s", event.getClassName(), event.getClassCode());
        String channelSlug = channelName.toLowerCase()
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-");

        Channel channel = Channel.builder()
                .sectionId(section.getId())
                .name(channelName)
                .slug(channelSlug)
                .description("Đây là kênh chung dành cho lớp " + event.getClassName() +
                        ".\nGhi chú giáo viên: " + event.getDescription())
                .scope(ChannelScope.MAIN)
                .type(ChannelType.TEXT)
                .isPublic(true)
                .isReadOnly(false)
                .status(ChannelStatus.ACTIVE)
                .position(0)
                .memberCount(0)
                .channelMembers(new ArrayList<>())
                .createdByUserId(workspace.getOwnerId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Save channel first to get the ID
        Channel savedChannel = channelRepository.save(channel);

        // Create teacher member - nickname và avatarUrl sẽ được lazy load sau
        ChannelMember teacherMember = ChannelMember.builder()
                .channelId(savedChannel.getId())
                .sectionId(section.getId())
                .userId(workspace.getOwnerId())
                .role(ChannelRole.OWNER)
                .status(MemberStatus.ACTIVE)
                .notificationLevel(NotificationLevel.ALL)
                .unreadCount(0)
                .unreadMentionCount(0)
                .joinedAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        savedChannel.addChannelMember(teacherMember);
        return channelRepository.save(savedChannel);
    }

    public void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event) {
        Section section = sectionRepository.findByClassId(event.getClassId())
                .stream()
                .filter(Section::isPublic)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
        section.addMembers(event.getStudentIds());

        Workspace workspace = workspaceRepository.findById(section.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Channel generalChannelForSection = channelRepository.findBySectionIdAndIsPublicTrue(section.getId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        List<ChannelMember> newChannelMembers = createChannelMembersForNewParticipants(event.getStudentIds(),
                section.getId(), generalChannelForSection.getId());
        generalChannelForSection.addChannelMembers(newChannelMembers);
        channelRepository.save(generalChannelForSection);
    }

    private List<ChannelMember> createChannelMembersForNewParticipants(List<String> newParticipantIds,
                                                                       String sectionId,
                                                                       String channelId) {
        return newParticipantIds.stream()
                .map(userId -> ChannelMember.builder()
                        .channelId(channelId)
                        .sectionId(sectionId)
                        .userId(userId)
                        .role(ChannelRole.STUDENT)
                        .status(MemberStatus.ACTIVE)
                        .notificationLevel(NotificationLevel.ALL)
                        .unreadCount(0)
                        .unreadMentionCount(0)
                        .joinedAt(Instant.now())
                        .updatedAt(Instant.now())
                        // nickname và avatarUrl sẽ được lazy load sau khi user có token
                        .build())
                .toList();
    }

    public Channel createGeneralChannel(String sectionId, Workspace workspace) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        Channel channel = Channel.builder()
                .sectionId(sectionId)
                .name("general")
                .slug("general")
                .description(String.format(
                        "Đây là kênh chung của môn học %s.\nMọi thắc mắc, trao đổi liên quan đến môn %s sẽ được thực hiện tại đây.",
                        workspace.getName(), workspace.getName()
                ))
                .scope(ChannelScope.MAIN)
                .type(ChannelType.TEXT)
                .isPublic(true)
                .isReadOnly(true)
                .status(ChannelStatus.ACTIVE)
                .position(0)
                .memberCount(0)
                .channelMembers(new ArrayList<>())
                .createdByUserId(workspace.getOwnerId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Save channel first to get the ID
        Channel savedChannel = channelRepository.save(channel);

        // Create channel members with the saved channel ID
        List<ChannelMember> channelMembers = this.createChannelMembersForNewParticipants(
                section.getSectionMembers(), sectionId, savedChannel.getId()
        );

        // Add members to the SAVED channel object and save again
        savedChannel.addChannelMembers(channelMembers);
        return channelRepository.save(savedChannel);
    }

    @Override
    public BasicChannelResponse createChannel(ChannelCreationRequest request) {
        String userId = JwtUtils.getUserId();

        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // Check if channel name already exists in section
        Optional<Channel> existingChannel = channelRepository
                .findBySectionIdAndName(request.getSectionId(), request.getChannelName());
        if (existingChannel.isPresent()) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS);
        }

        Channel channel = Channel.builder()
                .sectionId(section.getId())
                .name(request.getChannelName())
                .description(request.getDescription())
                .createdAt(Instant.now())
                .build();

        channel = channelRepository.save(channel);

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
                .sectionId(channel.getSectionId())
                .name(channel.getName())
                .description(channel.getDescription())
                .build();
    }

    @Override
    public List<BasicChannelResponse> getBasicChannels(String sectionId) {
        sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        List<Channel> channels = channelRepository.findBySectionId(sectionId);
        return channels.stream()
                .map(channelMapper::toBasicChannelResponse)
                .toList();
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
    public List<ChannelResponse> getChannels(String sectionId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        List<Channel> channels = channelRepository.findBySectionIdAndMemberUserId(sectionId, userId);

        List<ChannelResponse> channelResponse = channelMapper.toResponseList(channels);
        channelResponse.forEach(channel -> {
            List<ChatMessageResponse> messages = chatMessageService.getMessages(channel.getId());
            channel.setMessages(messages);
        });
        return channelResponse;
    }

    public List<UserResponse> getMembersInChannel(String channelId) {
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        return null;
    }

    @Override
    public void submitPractices(String channelId) {

    }

    @Override
    public void softDeleteChannel(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));

        channel.setStatus(ChannelStatus.DELETED);
        channelRepository.save(channel);
    }

}
