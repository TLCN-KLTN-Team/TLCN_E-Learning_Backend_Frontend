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
import demo.app.chat_app.service.util.ChannelPhase;
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

        // Idempotent: lookup-or-create channel. addTeacherMember/syncSectionMembers
        // tự dedup ở tầng repository (DuplicateKey → return existing) nên gọi không
        // điều kiện trên cả 2 nhánh để self-heal khi lần trước crash giữa chừng.
        Channel channel = channelRepository.findBySectionIdAndIsPublicTrue(section.getId())
                .orElseGet(() -> buildAndSaveFirstClassChannel(event, section, workspace));

        channelMemberService.addTeacherMemberToChannel(
                workspace.getOwnerId(), section.getId(), channel.getId());
        syncSectionMembersToChannel(section, channel);

        log.info("Class channel ready: section={} channel={} teacher={}",
                section.getId(), channel.getId(), workspace.getOwnerId());
        return channel;
    }

    private Channel buildAndSaveFirstClassChannel(ClassCreatedEvent event, Section section, Workspace workspace) {
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
                .memberCount(0) // sẽ được addMembersToChannel inc theo số thật sự insert
                .createdByUserId(workspace.getOwnerId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return channelRepository.save(channel);
    }

    /**
     * Đảm bảo mọi userId trong {@code section.sectionMembers} cũng là ChannelMember
     * ACTIVE của {@code channel}. Idempotent: dedup theo membership hiện có rồi
     * delegate cho {@link ChannelMemberService#addMembersToChannel} (per-record
     * fault-tolerant). Dùng để self-heal cả 2 nhánh new-channel & reuse-channel.
     */
    private void syncSectionMembersToChannel(Section section, Channel channel) {
        List<String> sectionMembers = section.getSectionMembers();
        if (sectionMembers == null || sectionMembers.isEmpty()) return;

        Set<String> existing = channelMemberService.getAllMembersInChannel(channel.getId())
                .stream()
                .map(ChannelMember::getUserId)
                .collect(Collectors.toSet());

        List<String> missing = sectionMembers.stream()
                .filter(id -> id != null && !existing.contains(id))
                .toList();
        if (missing.isEmpty()) return;

        List<ChannelMember> toAdd = channelMemberService.createChannelMembersForNewParticipants(
                missing, section.getId(), channel.getId());
        channelMemberService.addMembersToChannel(toAdd, channel.getId());
        log.info("Synced {} section-members → channel {} (section {})",
                missing.size(), channel.getId(), section.getId());
    }

    @Override
    public void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event) {
        Section section = sectionRepository.findByClassId(event.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // 1) Update section members trước (contains-check idempotent ở entity)
        List<String> userIds;
        if (event.getStudentIds() != null && !event.getStudentIds().isEmpty()) {
            userIds = event.getStudentIds();
        } else if (event.getStudents() != null && !event.getStudents().isEmpty()) {
            userIds = event.getStudents().stream()
                    .map(demo.app.chat_app.events.StudentInfo::getUserId)
                    .filter(Objects::nonNull)
                    .toList();
        } else {
            log.error("STUDENTS_ENROLLED event has no studentIds nor students");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (userIds.isEmpty()) {
            log.warn("STUDENTS_ENROLLED with empty user list — skipping");
            return;
        }

        section.addMembers(userIds);
        sectionRepository.save(section);

        // 2) Channel members. Ưu tiên dùng StudentInfo (đã có nickname/avatar) —
        // chỉ insert những user CHƯA là member; addMembersToChannel cũng tự nuốt
        // DuplicateKey nên không sợ race giữa retry.
        Channel channel = channelRepository.findBySectionIdAndIsPublicTrue(section.getId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        Set<String> existingChannelUserIds = channelMemberService
                .getAllMembersInChannel(channel.getId())
                .stream()
                .map(ChannelMember::getUserId)
                .collect(Collectors.toSet());

        List<ChannelMember> candidates;
        if (event.getStudents() != null && !event.getStudents().isEmpty()) {
            List<demo.app.chat_app.events.StudentInfo> fresh = event.getStudents().stream()
                    .filter(s -> s.getUserId() != null && !existingChannelUserIds.contains(s.getUserId()))
                    .toList();
            candidates = channelMemberService.createChannelMembersFromStudentInfo(
                    fresh, section.getId(), channel.getId());
        } else {
            List<String> freshIds = event.getStudentIds().stream()
                    .filter(id -> id != null && !existingChannelUserIds.contains(id))
                    .toList();
            candidates = channelMemberService.createChannelMembersForNewParticipants(
                    freshIds, section.getId(), channel.getId());
        }

        channelMemberService.addMembersToChannel(candidates, channel.getId());
        log.info("STUDENTS_ENROLLED done: section={} channel={} requested={} freshCandidates={}",
                section.getId(), channel.getId(), userIds.size(), candidates.size());
    }

    @Override
    public Channel createGeneralChannelInGeneralSection(String sectionId, Workspace workspace) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));

        // Idempotent: lookup-or-create + sync. addTeacher / sync-members tự dedup
        // ở tầng repository nên gọi không điều kiện trên cả 2 nhánh.
        Channel channel = channelRepository.findBySectionIdAndIsPublicTrue(sectionId)
                .orElseGet(() -> buildAndSaveGeneralChannel(sectionId, workspace));

        channelMemberService.addTeacherMemberToChannel(
                workspace.getOwnerId(), sectionId, channel.getId());
        syncSectionMembersToChannel(section, channel);

        log.info("General channel ready: section={} channel={} teacher={}",
                sectionId, channel.getId(), workspace.getOwnerId());
        return channel;
    }

    private Channel buildAndSaveGeneralChannel(String sectionId, Workspace workspace) {
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
        return channelRepository.save(channel);
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
     * Shuffle ngẫu nhiên rồi nối A→B→C→…→A.
     */
    private void assignCircularCrossReviewTargets(List<BasicChannelResponse> bulkChannelResponses) {
        List<String> channelIds = bulkChannelResponses.stream()
                .map(BasicChannelResponse::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        Map<String, String> pairing = buildCircularPairing(channelIds, new Random());

        List<Channel> channels = channelRepository.findAllById(pairing.keySet());
        for (Channel c : channels) {
            c.setReviewTargetChannelId(pairing.get(c.getId()));
        }
        channelRepository.saveAll(channels);
        log.info("UC-41: assigned circular cross-review for {} channels", pairing.size());
    }

    /**
     * Pure helper: xếp danh sách channelIds thành một chu trình duy nhất
     * A→B→C→…→A. Mỗi id chấm đúng 1 id khác, không tự chấm. Trả map
     * sourceId → targetId.
     *
     * Tách ra static để unit test không cần Mongo/Spring context.
     * Yêu cầu: channelIds.size() >= 2 (caller phải đảm bảo).
     */
    static Map<String, String> buildCircularPairing(List<String> channelIds, Random rng) {
        List<String> shuffled = new ArrayList<>(channelIds);
        Collections.shuffle(shuffled, rng);
        Map<String, String> pairing = new LinkedHashMap<>();
        int n = shuffled.size();
        for (int i = 0; i < n; i++) {
            pairing.put(shuffled.get(i), shuffled.get((i + 1) % n));
        }
        return pairing;
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
        // UC-41: nhóm chốt nộp bài. Chỉ được gọi khi channel còn phase OPEN.
        // Sau khi gọi: scheduler / cron sẽ chuyển trạng thái khi qua submissionDeadline,
        // nhưng nhóm có thể chủ động đóng sớm — đặt submissionClosedAt + chuyển status.
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        ChannelPhase.assertOpenForMember(channel);

        Instant now = Instant.now();
        channel.setSubmissionClosedAt(now);
        channel.setUpdatedAt(now);
        if (channel.isAllowCrossReview() && channel.getCrossReviewDeadline() != null) {
            channel.setStatus(ChannelStatus.LOCKED);
        } else {
            channel.setStatus(ChannelStatus.ARCHIVED);
            channel.setExpiredAt(now);
        }
        channelRepository.save(channel);
        log.info("UC-41: channel {} submitted early by member; new status = {}", channelId, channel.getStatus());
    }

}
