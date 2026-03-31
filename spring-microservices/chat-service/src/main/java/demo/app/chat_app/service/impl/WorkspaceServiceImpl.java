package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.WorkspaceCreationRequest;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.WorkspaceMapper;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.Section;
import demo.app.chat_app.model.workspace.Workspace;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.WorkspaceService;
import demo.app.chat_app.utils.JwtUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WorkspaceServiceImpl implements WorkspaceService {
    WorkspaceRepository workspaceRepository;
    SectionServiceImpl sectionService;
    ChannelRepository channelRepository;
    GetUserClient getUserClient;
    WorkspaceMapper workspaceMapper;
    ChannelServiceImpl channelService;

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
                .build();

        workspace = workspaceRepository.save(workspace);

        // Create default "general" channel
        Channel channel = Channel.builder()
                .name("general")
                .description("This is the start of the #general channel.")
                .createdAt(Instant.now())
                .build();
        channelRepository.save(channel);
        
        return workspaceMapper.toResponse(workspace);
    }

    public void createWorkspaceWhenCourseCreatedAndAssignForATeacher(CourseCreatedEvent event) {
        if (workspaceRepository.existsByCourseId(event.getCourseId())) {
            return; // Workspace already exists for this course
        }

        Workspace workspace = Workspace.builder()
                .courseId(event.getCourseId())
                .name(event.getCourseName())
                .description(event.getDescription())
                .ownerId(event.getTeacherId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        sectionService.createGeneralSection(savedWorkspace.getId(), savedWorkspace);
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
    public PageResponse<WorkspaceResponse> getWorkspacesWhenUserAccess(int page, int size) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Getting workspaces for userId: {} (page: {}, size: {})", userId, page, size);

        // Use repository method with pagination
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Find sections where user is a participant -> get workspaceIds
        List<String> workspaceIdsOfUser = sectionService.getWorkspaceIdsByUserId(userId);
        log.debug("Found {} workspace IDs for user {}: {}", workspaceIdsOfUser.size(), userId, workspaceIdsOfUser);

        Page<Workspace> workspacePage = workspaceRepository.findAllByIdIn(
                workspaceIdsOfUser, pageable
        );
        log.info("Retrieved {} workspaces for user {}", workspacePage.getContent().size(), userId);

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
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Getting workspaces by user: {} (page: {}, size: {})", userId, page, size);

        // Use pagination
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Find sections where user is a participant -> get workspaceIds
        List<String> workspaceIdsOfUser = sectionService.getWorkspaceIdsByUserId(userId);
        log.debug("Found {} workspace IDs for user {}: {}", workspaceIdsOfUser.size(), userId, workspaceIdsOfUser);

        // If user has no workspaces, return empty list
        if (workspaceIdsOfUser.isEmpty()) {
            log.info("No workspaces found for user {}", userId);
            return List.of();
        }

        Page<Workspace> workspacePage = workspaceRepository.findAllByIdIn(
                workspaceIdsOfUser, pageable
        );

        log.info("Retrieved {} workspaces for user {}", workspacePage.getContent().size(), userId);

        return workspacePage.getContent()
                .stream()
                .map(workspaceMapper::toResponse)
                .toList();
    }


}
