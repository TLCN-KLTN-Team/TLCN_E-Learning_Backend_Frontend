package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.ChannelRole;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.NotificationLevel;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.ChannelRepository;
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

    @Override
    public List<ChannelMember> createChannelMembersForNewParticipants(
            List<String> userIds,
            String sectionId,
            String channelId
    ) {
        return userIds.stream()
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
                        .firstName(member.getNickname())
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
