package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.StudentResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.events.StudentInfo;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.ChannelRole;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.NotificationLevel;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.httpclient.GetStudentClient;
import demo.app.chat_app.service.ChannelMemberService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelMemberServiceImpl implements ChannelMemberService {

    ChannelMemberRepository channelMemberRepository;
    ChannelRepository channelRepository;
    GetStudentClient getStudentClient;


    /**
     * Create channel member từ userId (gọi API để lấy student info)
     * @deprecated Dùng {@link #createChannelMemberFromStudentInfo} khi có student info sẵn
     */
    @Override
    @Deprecated
    public ChannelMember createChannelMember(String userId, String sectionId, String channelId) {
        try {
            StudentResponse studentInfo = getStudentClient.getStudentByUserId(userId)
                    .getResult();

            return ChannelMember.builder()
                    .channelId(channelId)
                    .sectionId(sectionId)
                    .userId(userId)
                    .studentId(studentInfo.getStudentId())
                    .role(ChannelRole.STUDENT)
                    .status(MemberStatus.ACTIVE)
                    .notificationLevel(NotificationLevel.ALL)
                    .unreadCount(0)
                    .unreadMentionCount(0)
                    .joinedAt(Instant.now())
                    .updatedAt(Instant.now())
                    .nickname(studentInfo.getLastName() + " " + studentInfo.getFirstName())
                    .build();
        } catch (AppException ae) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
    }

    /**
     * Create channel member từ StudentInfo (không cần gọi API)
     * Dùng khi nhận student info từ Kafka event
     */
    public ChannelMember createChannelMemberFromStudentInfo(
            StudentInfo studentInfo,
            String sectionId,
            String channelId
    ) {
        if (studentInfo == null || studentInfo.getUserId() == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        log.debug("Creating channel member from StudentInfo: userId={}, studentId={}",
                studentInfo.getUserId(), studentInfo.getStudentId());

        return ChannelMember.builder()
                .channelId(channelId)
                .sectionId(sectionId)
                .userId(studentInfo.getUserId())
                .studentId(studentInfo.getStudentId())
                .role(ChannelRole.STUDENT)
                .status(MemberStatus.ACTIVE)
                .notificationLevel(NotificationLevel.ALL)
                .unreadCount(0)
                .unreadMentionCount(0)
                .joinedAt(Instant.now())
                .updatedAt(Instant.now())
                .nickname((studentInfo.getLastName() != null ? studentInfo.getLastName() : "") +
                          " " +
                          (studentInfo.getFirstName() != null ? studentInfo.getFirstName() : ""))
                .build();
    }

    @Override
    public List<ChannelMember> createChannelMembersForNewParticipants(
            List<String> userIds,
            String sectionId,
            String channelId
    ) {
        return userIds.stream()
                .map(userId -> this.createChannelMember(
                        userId,
                        sectionId,
                        channelId
                ))
                .toList();
    }

    /**
     * Create channel members từ StudentInfo list (không cần gọi API)
     * Dùng khi nhận student info từ Kafka event
     */
    @Override
    public List<ChannelMember> createChannelMembersFromStudentInfo(
            List<StudentInfo> students,
            String sectionId,
            String channelId
    ) {
        log.info("Creating {} channel members from StudentInfo without API calls", students.size());
        return students.stream()
                .map(student -> createChannelMemberFromStudentInfo(
                        student,
                        sectionId,
                        channelId
                ))
                .toList();
    }

    @Override
    @Transactional
    public ChannelMember addMemberToChannel(ChannelMember channelMember) {
        // MongoDB unique index on (channelId, userId) will prevent duplicates
        ChannelMember savedMember = channelMemberRepository.save(channelMember);

        // Update channel member count
        updateChannelMemberCountInternal(channelMember.getChannelId(), 1);

        return savedMember;
    }

    @Override
    @Transactional
    public List<ChannelMember> addMembersToChannel(List<ChannelMember> channelMembers, String channelId) {
        if (channelMembers.isEmpty()) {
            return List.of();
        }

        // Save all members
        List<ChannelMember> savedMembers = channelMemberRepository.saveAll(channelMembers);

        // Update channel member count
        updateChannelMemberCountInternal(channelId, channelMembers.size());

        return savedMembers;
    }

    @Override
    @Transactional
    public void removeMemberFromChannel(String channelId, String userId) {
        channelMemberRepository.deleteByChannelIdAndUserId(channelId, userId);

        // Update channel member count
        updateChannelMemberCountInternal(channelId, -1);
    }

    @Override
    public List<UserResponse> getActiveMembersInChannel(String channelId) {
        // Verify channel exists
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        List<ChannelMember> members = channelMemberRepository
                .findByChannelIdAndStatus(channelId, MemberStatus.ACTIVE);

        return members.stream()
                .map(member -> UserResponse.builder()
                        .id(member.getUserId())
                        .nickname(member.getNickname())
                        .studentId(member.getStudentId())
                        .avatarUrl(member.getAvatarUrl())
                        .build())
                .toList();
    }

    @Override
    public List<ChannelMember> getAllMembersInChannel(String channelId) {
        return channelMemberRepository.findByChannelId(channelId);
    }

    @Override
    public boolean isActiveMember(String channelId, String userId) {
        return channelMemberRepository.existsByChannelIdAndUserIdAndStatus(
                channelId,
                userId,
                MemberStatus.ACTIVE
        );
    }

    @Override
    public ChannelMember getMembership(String channelId, String userId) {
        return channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElse(null);
    }

    @Override
    public long countActiveMembers(String channelId) {
        return channelMemberRepository.countByChannelIdAndStatus(channelId, MemberStatus.ACTIVE);
    }

    @Override
    @Transactional
    public void deleteAllMembersOfChannel(String channelId) {
        channelMemberRepository.deleteByChannelId(channelId);
    }

    @Override
    public List<String> getChannelIdsForUserInSection(String sectionId, String userId) {
        List<ChannelMember> memberships = channelMemberRepository
                .findActiveMembershipsBySectionAndUser(sectionId, userId);

        return memberships.stream()
                .map(ChannelMember::getChannelId)
                .toList();
    }

    @Override
    public void updateChannelMemberCount(String channelId) {
        long activeCount = countActiveMembers(channelId);

        channelRepository.findById(channelId).ifPresent(channel -> {
            channel.setMemberCount((int) activeCount);
            channelRepository.save(channel);
        });
    }

    /**
     * Internal method to update channel member count by delta.
     * Used after adding/removing members to avoid recounting.
     *
     * @param channelId ID of the channel
     * @param delta     Change in member count (positive for add, negative for remove)
     */
    private void updateChannelMemberCountInternal(String channelId, int delta) {
        channelRepository.findById(channelId).ifPresent(channel -> {
            int newCount = Math.max(0, channel.getMemberCount() + delta);
            channel.setMemberCount(newCount);
            channelRepository.save(channel);
        });
    }
}
