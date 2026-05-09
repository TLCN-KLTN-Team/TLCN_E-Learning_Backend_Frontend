package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.BulkRandomChannelRequest;
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
import demo.app.chat_app.service.ChannelMemberService;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.util.DateTimeUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelServiceImpl implements ChannelService {
    WorkspaceRepository workspaceRepository;
    SectionRepository sectionRepository;
    ChannelRepository channelRepository;
    ChannelMemberService channelMemberService;
    ChannelMapper channelMapper;
    ChatMessageServiceImpl chatMessageService;

    @Override
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
                .memberCount(1) // Teacher is the first member
                .createdByUserId(workspace.getOwnerId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Save channel first to get the ID
        Channel savedChannel = channelRepository.save(channel);

        // Firstly add teacher member to channel - nickname và avatarUrl sẽ được lazy load sau
        ChannelMember teacherMember = ChannelMember.builder()
                .sectionId(section.getId())
                .channelId(savedChannel.getId())
                .userId(workspace.getOwnerId())
                .build();

        // Save teacher member using ChannelMemberService
        channelMemberService.addMemberToChannel(teacherMember);

        return savedChannel;
    }

    @Override
    public void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event) {
        Section section = sectionRepository.findByClassId(event.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // Update section members (extract userIds from either studentIds or students)
        List<String> userIds = null;
        if (event.getStudentIds() != null && !event.getStudentIds().isEmpty()) {
            userIds = event.getStudentIds();
        } else if (event.getStudents() != null && !event.getStudents().isEmpty()) {
            userIds = event.getStudents().stream()
                    .map(demo.app.chat_app.events.StudentInfo::getUserId)
                    .filter(Objects::nonNull)
                    .toList();
        }

        if (userIds != null && !userIds.isEmpty()) {
            section.addMembers(userIds);
            sectionRepository.save(section);
            log.info("Updated section {} with {} new members", section.getId(), userIds.size());
        } else {
            log.warn("No user IDs found in event to update section members");
        }

        Channel generalChannelForSection = channelRepository.findBySectionIdAndIsPublicTrue(section.getId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        List<ChannelMember> newChannelMembers;

        // Ưu tiên dùng students (chứa full info) nếu có
        if (event.getStudents() != null && !event.getStudents().isEmpty()) {
            log.info("Using student info from event (no API calls needed)");
            newChannelMembers = channelMemberService.createChannelMembersFromStudentInfo(
                    event.getStudents(),
                    section.getId(),
                    generalChannelForSection.getId()
            );
        } else if (event.getStudentIds() != null && !event.getStudentIds().isEmpty()) {
            // Fallback: dùng old way với API calls
            log.warn("⚠Student info not found in event, falling back to API calls");
            newChannelMembers = channelMemberService.createChannelMembersForNewParticipants(
                    event.getStudentIds(),
                    section.getId(),
                    generalChannelForSection.getId()
            );
        } else {
            log.error("No student information found in event (neither students nor studentIds)");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Save all members (this will also update channel member count)
        channelMemberService.addMembersToChannel(newChannelMembers, generalChannelForSection.getId());
        log.info("Added {} members to channel {}", newChannelMembers.size(), generalChannelForSection.getId());
    }

    @Override
    public Channel createGeneralChannelInGeneralSection(String sectionId, Workspace workspace) {
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
                .createdByUserId(workspace.getOwnerId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Save channel first to get the ID
        Channel savedChannel = channelRepository.save(channel);

        // add teacher member to channel - nickname và avatarUrl sẽ được lazy load sau
        ChannelMember teacherMember = ChannelMember.builder()
                .sectionId(sectionId)
                .channelId(savedChannel.getId())
                .userId(workspace.getOwnerId())
                .build();
        channelMemberService.addMemberToChannel(teacherMember);

        // Create channel members with the saved channel ID using ChannelMemberService
        if (section.getSectionMembers() != null || !section.getSectionMembers().isEmpty()){

            List<ChannelMember> channelMembers = channelMemberService.createChannelMembersForNewParticipants(
                    section.getSectionMembers(), sectionId, savedChannel.getId()
            );

            // Save all members (this will also update member count)
            if (!channelMembers.isEmpty()) {
                channelMemberService.addMembersToChannel(channelMembers, savedChannel.getId());
            }
        }

        return channelRepository.findById(savedChannel.getId())
                .orElse(savedChannel);
    }

    /**
     * UC-41: validate 2 mốc deadline cho channel GROUP làm bài tập.
     * Service-side enforcement, không phụ thuộc bean validation.
     */
    private void validateDeadlines(String submissionStr, String crossReviewStr, boolean allowCrossReview) {
        if (submissionStr == null || submissionStr.isBlank()) {
            throw new AppException(ErrorCode.SUBMISSION_DEADLINE_REQUIRED);
        }
        Instant submission = DateTimeUtils.parseIsoToInstant(submissionStr);
        if (submission.isBefore(Instant.now())) {
            throw new AppException(ErrorCode.END_TIME_INVALID);
        }
        if (allowCrossReview) {
            if (crossReviewStr == null || crossReviewStr.isBlank()) {
                throw new AppException(ErrorCode.INVALID_DEADLINE_RANGE);
            }
            Instant crossReview = DateTimeUtils.parseIsoToInstant(crossReviewStr);
            if (crossReview.isBefore(submission.plus(1, ChronoUnit.HOURS))) {
                throw new AppException(ErrorCode.INVALID_DEADLINE_RANGE);
            }
        }
    }

    @Override
    public BasicChannelResponse createChannel(ChannelCreationRequest request) {

        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
        Workspace workspace = workspaceRepository.findById(section.getWorkspaceId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        // Check if channel name already exists in section
        Optional<Channel> existingChannel = channelRepository
                .findBySectionIdAndName(request.getSectionId(), request.getChannelName());
        if (existingChannel.isPresent()) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS);
        }

        // UC-41: validate + parse 2 deadline. crossReviewDeadline chỉ dùng khi allowCrossReview=true.
        validateDeadlines(request.getSubmissionDeadline(), request.getCrossReviewDeadline(), request.isAllowCrossReview());
        Instant submissionDeadline = DateTimeUtils.parseIsoToInstant(request.getSubmissionDeadline());
        Instant crossReviewDeadline = request.isAllowCrossReview()
                ? DateTimeUtils.parseIsoToInstant(request.getCrossReviewDeadline())
                : null;
        Instant expiresAt = crossReviewDeadline != null ? crossReviewDeadline : submissionDeadline;

        // Create channel entity
        Channel channel = Channel.builder()
                .sectionId(section.getId())
                .scope(ChannelScope.valueOf(request.getScope().toUpperCase()))
                .type(ChannelType.valueOf(request.getChannelType().toUpperCase()))
                .name(request.getChannelName())
                .slug(request.getChannelName().toLowerCase()
                        .replaceAll("[^a-z0-9-]", "-")
                        .replaceAll("-+", "-"))
                .description(request.getDescription())
                .createdAt(Instant.now())
                .expiresAt(expiresAt)
                .submissionDeadline(submissionDeadline)
                .crossReviewDeadline(crossReviewDeadline)
                .allowCrossReview(request.isAllowCrossReview())
                .status(ChannelStatus.ACTIVE)
                .build();

        Channel savedChannel = channelRepository.save(channel);
        // Create teacher member
        ChannelMember teacherMember = channelMemberService.addTeacherMemberToChannel(
                workspace.getOwnerId(),
                section.getId(),
                savedChannel.getId()
        );
        // Create channel members with the saved channel ID using ChannelMemberService
        List<ChannelMember> channelMembers = channelMemberService.createChannelMembersForNewParticipants(
                request.getMemberIds(), section.getId(), savedChannel.getId()
        );

        // Save all members (this will also update member count)
        if (!channelMembers.isEmpty()) {
            channelMemberService.addMembersToChannel(channelMembers, savedChannel.getId());
        }

        return channelMapper.toBasicChannelResponse(channel);
    }

    @Override
    @Transactional
    public BulkRandomChannelResponse bulkRandomlyCreateChannels(BulkRandomChannelRequest request) {

        // UC-41: validate trước khi tạo bất kỳ channel nào
        validateDeadlines(request.getSubmissionDeadline(), request.getCrossReviewDeadline(), request.isAllowCrossReview());

        // Get list members from section
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        List<BasicChannelResponse> bulkChannelResponses = new ArrayList<>();
        // Randomly assign members to groups
        Map<Integer, List<String>> groupAssignments = randomlyAssignMembersToGroups(
                new ArrayList<>(section.getSectionMembers()),
                request.getMembersPerGroup());

        // UC-41: cross-review cần >= 2 nhóm
        if (request.isAllowCrossReview() && groupAssignments.size() < 2) {
            throw new AppException(ErrorCode.NOT_ENOUGH_GROUPS_FOR_CROSS_REVIEW);
        }

        groupAssignments.forEach((groupNum, memberIds) -> {
            String channelName = String.format("%s - Nhóm %d", request.getChannelName(), groupNum);
            ChannelCreationRequest groupChannelRequest = ChannelCreationRequest.builder()
                    .sectionId(request.getSectionId())
                    .scope(ChannelScope.GROUP.getCode())
                    .channelType(ChannelType.GROUP.getCode())
                    .channelName(channelName)
                    .description(request.getDescription() + " (Nhóm " + groupNum + ")")
                    .memberIds(memberIds)
                    .submissionDeadline(request.getSubmissionDeadline())
                    .crossReviewDeadline(request.getCrossReviewDeadline())
                    .allowCrossReview(request.isAllowCrossReview())
                    .build();
            BasicChannelResponse channelResponse = this.createChannel(groupChannelRequest);
            bulkChannelResponses.add(channelResponse);
        });

        // UC-41: gán cross-review target theo vòng tròn A→B→C→…→A
        if (request.isAllowCrossReview() && bulkChannelResponses.size() >= 2) {
            assignCircularCrossReviewTargets(bulkChannelResponses);
        }

        return BulkRandomChannelResponse.builder()
                .channels(bulkChannelResponses)
                .build();
    }

    /**
     * UC-41: gán reviewTargetChannelId theo vòng tròn.
     * Shuffle ngẫu nhiên rồi nối A→B→C→…→A. Mỗi nhóm chấm đúng 1 nhóm khác,
     * không trùng chính nó, không có nhóm nào bị bỏ qua.
     */
    private void assignCircularCrossReviewTargets(List<BasicChannelResponse> bulkChannelResponses) {
        List<String> channelIds = bulkChannelResponses.stream()
                .map(BasicChannelResponse::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(channelIds);

        List<Channel> channels = channelRepository.findAllById(channelIds);
        Map<String, Channel> byId = channels.stream()
                .collect(Collectors.toMap(Channel::getId, c -> c));
        for (int i = 0; i < channelIds.size(); i++) {
            String currentId = channelIds.get(i);
            String targetId = channelIds.get((i + 1) % channelIds.size());
            byId.get(currentId).setReviewTargetChannelId(targetId);
        }
        channelRepository.saveAll(channels);
        log.info("UC-41: assigned circular cross-review for {} channels", channelIds.size());
    }

    @Override
    public BasicChannelResponse getCrossReviewTarget(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        if (!channel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }
        if (channel.getReviewTargetChannelId() == null) {
            throw new AppException(ErrorCode.NO_CROSS_REVIEW_TARGET);
        }
        Channel target = channelRepository.findById(channel.getReviewTargetChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        return channelMapper.toBasicChannelResponse(target);
    }

    private Map<Integer, List<String>> randomlyAssignMembersToGroups(List<String> memberIds, int membersPerGroup) {
        Map<Integer, List<String>> groupAssignments = new HashMap<>();

        int groupNum = 1;
        while (!memberIds.isEmpty()) {
            List<String> groupMembersOfGroupI = new ArrayList<>();

            if (memberIds.size() <= membersPerGroup) {
                groupMembersOfGroupI.addAll(memberIds);
                memberIds.clear();
                groupAssignments.put(groupNum, groupMembersOfGroupI);
                break;
            }

            for (int i = 0; i < membersPerGroup; i++) {
                int randomIndex = new Random().nextInt(memberIds.size());
                String memberId = memberIds.remove(randomIndex);
                groupMembersOfGroupI.add(memberId);
            }

            groupAssignments.put(groupNum, groupMembersOfGroupI);
            groupNum++;
        }

        return groupAssignments;
    }

    @Override
    public ChannelResponse updateChannel(String id, BulkRandomChannelRequest request) {
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
                .name(channel.getName())
                .build();
    }

    @Override
    public List<BasicChannelResponse> getBasicChannels(String sectionId) {
        List<Channel> channelList = channelRepository.findAllBySectionId(sectionId);

        return channelList.stream()
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
    public ChannelResponse getPublicChannelBySectionId(String sectionId) {
        sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
        Channel channel = channelRepository.findBySectionIdAndIsPublicTrue(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        return channelMapper.toResponse(channel);
    }

    @Override
    public List<ChannelResponse> getChannels(String sectionId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // Find channels through ChannelMemberService
        List<String> channelIds = channelMemberService.getChannelIdsForUserInSection(sectionId, userId);

        // Find channels by IDs
        List<Channel> channels = channelRepository.findAllById(channelIds);

        List<ChannelResponse> channelResponse = channelMapper.toResponseList(channels);
        channelResponse.forEach(channel -> {
            List<ChatMessageResponse> messages = chatMessageService.getMessages(channel.getId());
            channel.setMessages(messages);
        });
        return channelResponse;
    }

    @Override
    public List<UserResponse> getMembersInChannel(String channelId) {
        // Use ChannelMemberService to get active members
        return channelMemberService.getActiveMembersInChannel(channelId);
    }

    @Override
    public void submitPractices(String channelId) {

    }

}
