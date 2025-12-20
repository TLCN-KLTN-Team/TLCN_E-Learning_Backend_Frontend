package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.CreateWorkspacesRequest;
import demo.app.chat_app.dto.request.WorkspaceCreationRequest;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.WorkspaceMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Section;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.WorkspaceService;
import demo.app.chat_app.utils.JwtUtils;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
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
    SectionServiceImpl sectionService;

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

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .avatarUrl(request.getAvatarUrl())
                .description(request.getDescription())
//                .courseId(request.getCourseId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isActive(true)
                .build();

        workspace = workspaceRepository.save(workspace);

        // Create default "general" channel
        Channel channel = Channel.builder()
                .channelName("general")
                .description("This is the start of the #general channel.")
                .createdAt(Instant.now())
                .build();
        
        channel = channelRepository.save(channel);

        // Add channel to workspace
        workspace.addChannel(channel.getId());
        workspace = workspaceRepository.save(workspace);

        WorkspaceResponse workspaceResponse = workspaceMapper.toResponse(workspace);
        return workspaceResponse;
    }

    public void createWorkspaceWhenCourseCreatedAndAssignForATeacher(CourseCreatedEvent event) {
        if (workspaceRepository.existsByCourseId(event.getCourseId())) {
            return; // Workspace already exists for this course
        }

        // add members for workspace

        Workspace workspace = Workspace.builder()
                .courseId(event.getCourseId())
                .name(event.getCourseName())
                .description(event.getDescription())
                .ownerId(event.getTeacherId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
//                .endedAt(event.getEndedAt())
                .isActive(true)
                .participants(Collections.singletonList(event.getTeacherId()))
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        Section section = sectionService.createGeneralSection(workspace.getParticipants(), savedWorkspace.getId(), savedWorkspace);
        savedWorkspace.addSectionId(section.getId());
        workspaceRepository.save(savedWorkspace);
    }

    // Method add members and check if user exists in the system
//    private List<Participant> getExistingMembersFromCourseCreated(List<String> memberIds) {
//        List<Participant> existingMembers = new ArrayList<>();
//        memberIds.forEach(id -> {
//            try{
//                var user = getUserClient.getUser(id).getResult();
//                Participant participant = Participant.builder()
//                        .userId(user.getId())
//                        .firstName(user.getFirstName())
//                        .lastName(user.getLastName())
//                        .avatarUrl(user.getAvatar())
//                        .joinedAt(Instant.now())
//                        .build();
//                if (participant==null) {
//                    throw new AppException(ErrorCode.USER_NOT_EXISTED);
//                }
//                existingMembers.add(participant);
//            }
//            catch (FeignException fe) {
//                throw new AppException(ErrorCode.USER_NOT_FOUND_FROM_FEIGN_CLIENT);
//            }
//        });
//        return existingMembers;
//    }

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
        Page<Workspace> workspacePage = workspaceRepository.findByParticipants(userId, pageable);

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

    @Override
    public List<WorkspaceResponse> getWorkspacesByUser(int page, int size) {
        String userId = JwtUtils.getUserId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Workspace> workspaces = workspaceRepository.findByParticipants(userId, pageable);

        return List.of();
    }


}
