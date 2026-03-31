package demo.app.chat_app.service;

import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.events.StudentInfo;
import demo.app.chat_app.model.workspace.ChannelMember;

import java.util.List;

/**
 * Service quản lý ChannelMember (thành viên của channel).
 * Tách riêng để dễ bảo trì và tái sử dụng logic liên quan đến membership.
 */
public interface ChannelMemberService {

    ChannelMember createChannelMember(
            String userId,
            String sectionId,
            String channelId
    );

    /**
     * Tạo danh sách ChannelMember cho participants mới.
     *
     * @param userIds    Danh sách user IDs cần thêm vào channel
     * @param sectionId  ID của section
     * @param channelId  ID của channel
     * @return Danh sách ChannelMember đã tạo (chưa save)
     */
    List<ChannelMember> createChannelMembersForNewParticipants(
            List<String> userIds,
            String sectionId,
            String channelId
    );

    /**
     * Tạo danh sách ChannelMember từ StudentInfo (không cần gọi API)
     * Dùng khi nhận student info từ Kafka event
     *
     * @param students  Danh sách StudentInfo từ event
     * @param sectionId ID của section
     * @param channelId ID của channel
     * @return Danh sách ChannelMember đã tạo (chưa save)
     */
    List<ChannelMember> createChannelMembersFromStudentInfo(
            List<StudentInfo> students,
            String sectionId,
            String channelId
    );

    /**
     * Thêm một member vào channel.
     *
     * @param channelMember ChannelMember cần thêm
     * @return ChannelMember đã được lưu
     */
    ChannelMember addMemberToChannel(ChannelMember channelMember);

    /**
     * Thêm nhiều members vào channel và cập nhật member count.
     *
     * @param channelMembers Danh sách ChannelMember cần thêm
     * @param channelId      ID của channel cần cập nhật count
     * @return Danh sách ChannelMember đã được lưu
     */
    List<ChannelMember> addMembersToChannel(List<ChannelMember> channelMembers, String channelId);

    ChannelMember addTeacherMemberToChannel(String teacherId, String sectionId, String channelId);


    /**
     * Xóa một member khỏi channel.
     *
     * @param channelId ID của channel
     * @param userId    ID của user cần xóa
     */
    void removeMemberFromChannel(String channelId, String userId);

    /**
     * Lấy danh sách members ACTIVE trong channel.
     *
     * @param channelId ID của channel
     * @return Danh sách UserResponse
     */
    List<UserResponse> getActiveMembersInChannel(String channelId);

    /**
     * Lấy danh sách tất cả members trong channel (bất kể status).
     *
     * @param channelId ID của channel
     * @return Danh sách ChannelMember
     */
    List<ChannelMember> getAllMembersInChannel(String channelId);

    /**
     * Kiểm tra xem user có phải là active member của channel không.
     *
     * @param channelId ID của channel
     * @param userId    ID của user
     * @return true nếu là active member, false nếu không
     */
    boolean isActiveMember(String channelId, String userId);

    /**
     * Lấy thông tin membership của user trong channel.
     *
     * @param channelId ID của channel
     * @param userId    ID của user
     * @return ChannelMember hoặc null nếu không tìm thấy
     */
    ChannelMember getMembership(String channelId, String userId);

    /**
     * Đếm số lượng active members trong channel.
     *
     * @param channelId ID của channel
     * @return Số lượng active members
     */
    long countActiveMembers(String channelId);

    /**
     * Xóa tất cả members của channel (khi xóa channel).
     *
     * @param channelId ID của channel
     */
    void deleteAllMembersOfChannel(String channelId);

    /**
     * Lấy danh sách channels mà user là active member (trong một section).
     *
     * @param sectionId ID của section
     * @param userId    ID của user
     * @return Danh sách channel IDs
     */
    List<String> getChannelIdsForUserInSection(String sectionId, String userId);


    void updateChannelMemberCount(String channelId);

    ChannelMember getChannelMemberByChannelIdAndUserId(String channelId, String userId);
}
