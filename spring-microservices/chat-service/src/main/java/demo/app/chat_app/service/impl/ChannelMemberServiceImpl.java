package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.StudentResponse;
import demo.app.chat_app.dto.response.TeacherResponse;
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
import demo.app.chat_app.repository.httpclient.TeacherClient;
import demo.app.chat_app.service.ChannelMemberService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelMemberServiceImpl implements ChannelMemberService {

    ChannelMemberRepository channelMemberRepository;
    ChannelRepository channelRepository;
    GetStudentClient getStudentClient;
    TeacherClient teacherClient;

    /**
     * Create channel member từ userId (gọi API để lấy student info)
     *
     * Chỉ dùng được khi HTTP request gọi hàm, chứ không gọi thông qua Kafka event (vì đã có hàm createChannelMemberFromStudentInfo để dùng trong trường hợp đó)
     */
    @Override
    @Transactional
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

    /**
     * Idempotent insert: nếu (channelId, userId) đã tồn tại do race / replay,
     * trả về bản ghi cũ thay vì throw. Caller (teacher/student add) chỉ cần
     * gọi 1 lần và biết chắc record có trong DB sau khi return.
     */
    @Override
    @Transactional
    public ChannelMember addMemberToChannel(ChannelMember channelMember) {
        try {
            ChannelMember savedMember = channelMemberRepository.save(channelMember);
            updateChannelMemberCountInternal(channelMember.getChannelId(), 1);
            return savedMember;
        } catch (DuplicateKeyException dup) {
            log.info("ChannelMember already exists for channel={} user={} — returning existing",
                    channelMember.getChannelId(), channelMember.getUserId());
            return channelMemberRepository
                    .findByChannelIdAndUserId(channelMember.getChannelId(), channelMember.getUserId())
                    .orElseThrow(() -> dup);
        }
    }

    /**
     * Bulk add với per-record fault tolerance: lưu từng member trong vòng try/catch
     * để 1 duplicate (race / replay) không kéo cả batch xuống — phần còn lại vẫn
     * được persist. Trả về danh sách đã thật sự lưu (mới + tồn-tại-trước).
     *
     * Member count chỉ tăng theo số bản ghi MỚI thực sự insert, không tính bản ghi
     * trùng đã có sẵn → tránh inflated count khi event replay.
     */
    @Override
    @Transactional
    public List<ChannelMember> addMembersToChannel(List<ChannelMember> channelMembers, String channelId) {
        if (channelMembers == null || channelMembers.isEmpty()) {
            return List.of();
        }

        List<ChannelMember> persisted = new ArrayList<>(channelMembers.size());
        int newlyInserted = 0;
        int duplicates = 0;
        int failures = 0;

        for (ChannelMember member : channelMembers) {
            try {
                persisted.add(channelMemberRepository.save(member));
                newlyInserted++;
            } catch (DuplicateKeyException dup) {
                duplicates++;
                channelMemberRepository
                        .findByChannelIdAndUserId(member.getChannelId(), member.getUserId())
                        .ifPresent(persisted::add);
                log.debug("Skipped duplicate ChannelMember channel={} user={}",
                        member.getChannelId(), member.getUserId());
            } catch (Exception ex) {
                failures++;
                log.error("Failed to save ChannelMember channel={} user={}: {}",
                        member.getChannelId(), member.getUserId(), ex.getMessage());
            }
        }

        if (newlyInserted > 0) {
            updateChannelMemberCountInternal(channelId, newlyInserted);
        }
        log.info("addMembersToChannel channel={} requested={} inserted={} duplicates={} failures={}",
                channelId, channelMembers.size(), newlyInserted, duplicates, failures);
        return persisted;
    }

    /**
     * Thêm teacher vào channel. Luôn persist ChannelMember kể cả khi teacher-service
     * không trả được info — bắt mọi exception và rơi xuống fallback raw-userId để
     * không bao giờ bỏ qua bước save (đây là cách user pass access check).
     *
     * Idempotent: {@link #addMemberToChannel} đã handle DuplicateKey → trả về
     * record cũ. Gọi lại không sinh duplicate.
     */
    @Override
    public ChannelMember addTeacherMemberToChannel(String teacherId, String sectionId, String channelId) {
        TeacherResponse teacherInfo = null;
        try {
            teacherInfo = teacherClient.getTeacherById(teacherId).getResult();
        } catch (Exception ex) {
            log.warn("Cannot fetch teacher info for teacherId={} ({}). Saving with raw userId.",
                    teacherId, ex.getMessage());
        }

        String nickname = teacherInfo != null
                ? ((teacherInfo.getLastName() != null ? teacherInfo.getLastName() : "")
                    + " "
                    + (teacherInfo.getFirstName() != null ? teacherInfo.getFirstName() : "")).trim()
                : "";
        ChannelMember channelMember = ChannelMember.builder()
                .channelId(channelId)
                .sectionId(sectionId)
                .userId(teacherId)
                .studentId(teacherInfo != null ? teacherInfo.getTeacherId() : null)
                .role(ChannelRole.TEACHER)
                .status(MemberStatus.ACTIVE)
                .notificationLevel(NotificationLevel.ALL)
                .unreadCount(0)
                .unreadMentionCount(0)
                .joinedAt(Instant.now())
                .updatedAt(Instant.now())
                .nickname(nickname.isBlank() ? null : nickname)
                .avatarUrl(teacherInfo != null ? teacherInfo.getAvatarUrl() : null)
                .build();
        return addMemberToChannel(channelMember);
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
                        .isOwner(member.getRole() == ChannelRole.TEACHER)
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

    @Override
    public ChannelMember getChannelMemberByChannelIdAndUserId(String channelId, String userId) {
        return channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_FOUND));
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
