package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.request.CreateWorkspacesRequest;
import demo.app.chat_app.dto.request.WorkspaceCreationRequest;
import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.WorkspaceMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Participant;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.WorkspaceService;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WorkspaceServiceImpl implements WorkspaceService {
    WorkspaceRepository workspaceRepository;
    ChannelRepository channelRepository;
    GetUserClient getUserClient;
    WorkspaceMapper workspaceMapper;
    ChannelServiceImpl channelService;

    @Override
    public void createWorkspacesWhenRegisteredForCourses(CreateWorkspacesRequest request) {

    }

    @Override
    public WorkspaceResponse createWorkspace(WorkspaceCreationRequest request) {
        String instructorId = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = getUserClient.getUser(instructorId).getResult();
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        // Check if workspace already exists for this course and instructor
        Optional<Workspace> existingWorkspace = workspaceRepository
                .findByCourseIdAndOwnerIdAndIsActive(request.getCourseId(), instructorId);
        if (existingWorkspace.isPresent()) {
            throw new AppException(ErrorCode.WORKSPACE_ALREADY_EXISTS);
        }

        // Check if members exist in the system
        List<Participant> existingMembers = getExistingMembersFromCourseCreated(request.getMemberIds());

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .avatarUrl(request.getAvatarUrl())
                .description(request.getDescription())
//                .courseId(request.getCourseId())
                .ownerId(instructorId)
                .members(existingMembers)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isActive(true)
                .build();

        workspace = workspaceRepository.save(workspace);

        // Create default "general" channel
        Channel channel = Channel.builder()
                .channelName("general")
                .description("This is the start of the #general channel.")
                .workspaceId(workspace.getId())
                .participants(workspace.getMembers())
                .createdAt(Instant.now())
                .build();
        
        channel = channelRepository.save(channel);

        // Add channel to workspace
        workspace.addChannel(channel.getId());
        workspace = workspaceRepository.save(workspace);

        WorkspaceResponse workspaceResponse = workspaceMapper.toResponse(workspace);
        return workspaceResponse;
    }

    public void createWorkspaceWhenCourseCreated(CourseCreatedEvent event) {
        if (workspaceRepository.existsByCourseId(event.getCourseId())) {
            return; // Workspace already exists for this course
        }

        // add members for workspace
        List<String> memberIds = Collections.singletonList(event.getStudentIds() + event.getInstructorId());
        List<Participant> members = this.getExistingMembersFromCourseCreated(memberIds);

        Workspace workspace = Workspace.builder()
                .courseId(event.getCourseId())
                .name(event.getCourseName())
                .description(event.getDescription())
                .ownerId(event.getInstructorId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
//                .endedAt(event.getEndedAt())
                .isActive(true)
                .members(members)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Create default "general" channel
        Channel channel = Channel.builder()
                .channelName("general")
                .description("Đây là kênh chung của khóa học " + event.getCourseName() +".\n Mọi thắc mắc, trao đổi liên quan đến khóa học sẽ được thực hiện tại đây.")
                .workspaceId(savedWorkspace.getId())
                .participants(savedWorkspace.getMembers())
                .createdAt(Instant.now())
//                .endedAt(event.getEndedAt())
                .build();

        Channel savedChannel = channelRepository.save(channel);
        savedWorkspace.addChannel(savedChannel.getId());
        workspaceRepository.save(savedWorkspace);
    }

    // Method add members and check if user exists in the system
    private List<Participant> getExistingMembersFromCourseCreated(List<String> memberIds) {
        List<Participant> existingMembers = new ArrayList<>();
        memberIds.forEach(id -> {
            try{
                var user = getUserClient.getUser(id).getResult();
                Participant participant = Participant.builder()
                        .userId(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .avatarUrl(user.getAvatar())
                        .joinedAt(Instant.now())
                        .build();
                if (participant==null) {
                    throw new AppException(ErrorCode.USER_NOT_EXISTED);
                }
                existingMembers.add(participant);
            }
            catch (FeignException fe) {
                throw new AppException(ErrorCode.USER_NOT_FOUND_FROM_FEIGN_CLIENT);
            }
        });
        return existingMembers;
    }

    @Override
    public WorkspaceResponse updateWorkspace(WorkspaceCreationRequest request) {
        return null;
    }

    @Override
    public void deleteWorkspace(String id) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));
        workspaceRepository.delete(workspace);
    }

    @Override
    public PageResponse<WorkspaceResponse> getWorkspaces(int page, int size) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Use repository method with pagination
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Workspace> workspacePage = workspaceRepository.findByOwnerIdOrMemberUserIdAndIsActive(userId, pageable);

        return toPageResponse(workspacePage);
    }
    
    private PageResponse<WorkspaceResponse> toPageResponse(Page<Workspace> workspaces) {
        List<WorkspaceResponse> responses = workspaces
                .getContent()
                .stream()
                .map(workspaceMapper::toResponse)
                .toList();

        return PageResponse.<WorkspaceResponse>builder()
                .content(responses)
                .pageNumber(workspaces.getNumber())
                .pageSize(workspaces.getSize())
                .totalElements(workspaces.getTotalElements())
                .totalPages(workspaces.getTotalPages())
                .last(workspaces.isLast())
                .build();
    }

    @Override
    public WorkspaceResponse getWorkspaceById(String id) {
        Workspace workspace = workspaceRepository.findById(id).orElseThrow(() ->
                new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        return workspaceMapper.toResponse(workspace);
    }


}
