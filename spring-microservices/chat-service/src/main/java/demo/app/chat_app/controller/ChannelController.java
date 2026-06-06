package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.BulkRandomChannelRequest;
import demo.app.chat_app.dto.request.CrossReviewBatchSubmitRequest;
import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.request.UpdateGroupScoreRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.workspace.GroupFinalScore;
import demo.app.chat_app.service.AttachmentService;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.CrossReviewService;
import demo.app.chat_app.service.ScoreCollectionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/channels")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelController {
    ChannelService channelService;
    AttachmentService attachmentService;
    CrossReviewService crossReviewService;
    ScoreCollectionService scoreCollectionService;

    @GetMapping("/{channelId}")
    public ApiResponse<ChannelResponse> getChannel(@PathVariable String channelId) {
        ChannelResponse response = channelService.getChannelById(channelId);
        return ApiResponse.<ChannelResponse>builder()
                .result(response)
                .message("Channel retrieved successfully")
                .build();
    }

    @GetMapping("/list/section/{sectionId}")
    public ApiResponse<List<BasicChannelResponse>> getListBasicChannelBySectionId(@PathVariable String sectionId) {
        List<BasicChannelResponse> channels = channelService.getBasicChannels(sectionId);
        return ApiResponse.<List<BasicChannelResponse>>builder()
                .result(channels)
                .message("Channels retrieved successfully")
                .build();
    }

    @GetMapping("/section/{sectionId}")
    public ApiResponse<ChannelResponse> getPublicChannelBySectionId(@PathVariable String sectionId) {
        return ApiResponse.<ChannelResponse>builder()
                .result(channelService.getPublicChannelBySectionId(sectionId))
                .message("Channels retrieved successfully")
                .build();
    }

    @GetMapping("/members/{channelId}")
    public ApiResponse<List<UserResponse>> getMembersInChannel(@PathVariable String channelId) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(channelService.getMembersInChannel(channelId))
                .message("Channel members retrieved successfully")
                .build();
    }

    @PostMapping("/create")
    public ApiResponse<BasicChannelResponse> createChannel(@RequestBody ChannelCreationRequest request){
        try{
            BasicChannelResponse channelResponse = channelService.createChannel(request);
            return ApiResponse.<BasicChannelResponse>builder()
                    .result(channelResponse)
                    .message("Channel created successfully")
                    .build();
        }catch (Exception e){
            return ApiResponse.<BasicChannelResponse>builder()
                    .message("Failed to create channel: " + e.getMessage())
                    .build();
        }
    }

    @PostMapping("/bulk-random")
    public ApiResponse<?> bulkRandomChannels(@RequestBody BulkRandomChannelRequest request) {

        try {
            BulkRandomChannelResponse response = channelService.bulkRandomlyCreateChannels(request);
            return ApiResponse.<BulkRandomChannelResponse>builder()
                    .result(response)
                    .message("Channels created successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.builder()
                    .message("Failed to bulk create channels: " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/update/{channelId}")
    public ApiResponse<ChannelResponse> updateChannel(@RequestBody BulkRandomChannelRequest request,
                                                      @PathVariable String channelId){
        try{
            ChannelResponse channelResponse = channelService.updateChannel(channelId, request);
            return ApiResponse.<ChannelResponse>builder()
                    .result(channelResponse)
                    .message("Channel updated successfully")
                    .build();
        }catch (Exception e){
            return ApiResponse.<ChannelResponse>builder()
                    .message("Failed to update channel: " + e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/delete/{channelId}")
    public ApiResponse<Void> deleteChannel(@PathVariable String channelId) {
        try {
            channelService.deleteChannel(channelId);
            return ApiResponse.<Void>builder()
                    .message("Channel deleted successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.<Void>builder()
                    .message("Failed to delete channel: " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/submit/{channelId}")
    public ApiResponse<Void> endChannel(@PathVariable String channelId) {
        // UC-41: nhóm chủ động chốt nộp bài. Throw nếu đã qua phase OPEN.
        channelService.submitPractices(channelId);
        return ApiResponse.<Void>builder()
                .message("Channel ended successfully")
                .build();
    }

    // ══════════════════════════════════════════════════════════════════
    // UC-41: Cross-review & file panel
    // ══════════════════════════════════════════════════════════════════

    /**
     * Liệt kê attachments của channel theo category (Tài liệu chung / Bài đã nộp).
     * Default = GENERAL nếu không truyền query param.
     */
    @GetMapping("/{channelId}/attachments")
    public ApiResponse<List<AttachmentResponse>> getChannelAttachments(
            @PathVariable String channelId,
            @RequestParam(value = "category", required = false) AttachmentCategory category) {
        List<AttachmentResponse> attachments = attachmentService.listByChannel(channelId, category);
        return ApiResponse.<List<AttachmentResponse>>builder()
                .result(attachments)
                .message("Channel attachments retrieved successfully")
                .build();
    }

    /**
     * UC-41: Lấy các file SUBMISSION được track trong AssignmentSession cho channel này.
     * Dùng cho panel "Bài đã nộp" — load từ session.submittedFileMessageIds thay vì query trực tiếp theo category.
     * Trả về empty list nếu channel không thuộc assignment session nào.
     */
    @GetMapping("/{channelId}/session-submissions")
    public ApiResponse<List<AttachmentResponse>> getSessionSubmissions(@PathVariable String channelId) {
        return ApiResponse.<List<AttachmentResponse>>builder()
                .result(attachmentService.listSessionSubmissionsForChannel(channelId))
                .message("Session submissions retrieved successfully")
                .build();
    }

    /**
     * UC-41: bài nộp của TẤT CẢ nhóm khác trong cùng AssignmentSession, gom theo nhóm.
     * Chỉ truy cập được trong phase REVIEW. FE dùng để hiển thị bài của từng nhóm và cho điểm.
     */
    @GetMapping("/{channelId}/cross-review-attachments")
    public ApiResponse<List<SessionGroupSubmissionsResponse>> getCrossReviewAttachments(@PathVariable String channelId) {
        return ApiResponse.<List<SessionGroupSubmissionsResponse>>builder()
                .result(attachmentService.listSubmissionsForCrossReview(channelId))
                .message("Cross-review submissions retrieved successfully")
                .build();
    }

    /**
     * Liệt kê ảnh (IMAGE) đã gửi trong channel — phục vụ gallery "Ảnh đã gửi"
     * trong panel thông tin kênh.
     */
    @GetMapping("/{channelId}/images")
    public ApiResponse<List<AttachmentResponse>> getChannelImages(@PathVariable String channelId) {
        return ApiResponse.<List<AttachmentResponse>>builder()
                .result(attachmentService.listImagesByChannel(channelId))
                .message("Channel images retrieved successfully")
                .build();
    }

    /**
     * Liệt kê file (mọi attachmentType trừ IMAGE) đã gửi trong channel —
     * phục vụ mục "File đã gửi" trong panel thông tin kênh.
     */
    @GetMapping("/{channelId}/files")
    public ApiResponse<List<AttachmentResponse>> getChannelFiles(@PathVariable String channelId) {
        return ApiResponse.<List<AttachmentResponse>>builder()
                .result(attachmentService.listFilesByChannel(channelId))
                .message("Channel files retrieved successfully")
                .build();
    }

    // ══════════════════════════════════════════════════════════════════
    // UC-41: Cross-review submit (điểm + nhận xét)
    // ══════════════════════════════════════════════════════════════════

    /**
     * Nhóm chấm chéo submit điểm + nhận xét cho nhóm mà mình được phân công.
     * Upsert theo cặp (reviewerChannelId, reviewedChannelId); bắn notification
     * tới mọi thành viên nhóm bị chấm.
     */
    @PostMapping("/{channelId}/cross-review/submit")
    public ApiResponse<CrossReviewScoreResponse> submitCrossReview(
            @PathVariable String channelId,
            @Valid @RequestBody CrossReviewSubmitRequest request) {
        return ApiResponse.<CrossReviewScoreResponse>builder()
                .result(crossReviewService.submitReview(channelId, request))
                .message("Cross-review submitted successfully")
                .build();
    }

    /**
     * Tất cả điểm nhóm này đã nộp trong session — FE dùng để prefill form theo từng nhóm.
     */
    @GetMapping("/{channelId}/cross-review/my-score")
    public ApiResponse<List<CrossReviewScoreResponse>> getMyCrossReview(@PathVariable String channelId) {
        return ApiResponse.<List<CrossReviewScoreResponse>>builder()
                .result(crossReviewService.getMyReviews(channelId))
                .message("Cross-review scores retrieved successfully")
                .build();
    }

    /**
     * UC-41 Batch: nhóm nộp toàn bộ điểm đã lưu cục bộ trong một lần ("Nộp bài chấm").
     * Upsert CrossReviewScoreOfGroup + từng CrossReviewScore; bắn notification.
     */
    @PostMapping("/{channelId}/cross-review/batch-submit")
    public ApiResponse<CrossReviewScoreOfGroupResponse> submitBatchCrossReview(
            @PathVariable String channelId,
            @Valid @RequestBody CrossReviewBatchSubmitRequest request) {
        return ApiResponse.<CrossReviewScoreOfGroupResponse>builder()
                .result(crossReviewService.submitBatchReview(channelId, request))
                .message("Batch cross-review submitted successfully")
                .build();
    }

    /**
     * UC-41: Tính điểm cuối cùng của nhóm channelId theo thuật toán Median.
     * Dành cho giảng viên hoặc hệ thống dùng sau khi phase REVIEW kết thúc.
     */
    @GetMapping("/{channelId}/cross-review/final-score")
    public ApiResponse<FinalScoreResponse> getCrossReviewFinalScore(@PathVariable String channelId) {
        return ApiResponse.<FinalScoreResponse>builder()
                .result(crossReviewService.calculateFinalScore(channelId))
                .message("Final score calculated successfully")
                .build();
    }

    // ══════════════════════════════════════════════════════════════════
    // UC-41: Assignment Session — dùng khi chấm điểm tổng kết
    // ══════════════════════════════════════════════════════════════════

    /**
     * Lấy thông tin một phiên làm bài (tất cả nhóm + trạng thái đã nộp).
     * Giáo viên dùng endpoint này để tổng quan tiến độ và chấm điểm cuối kỳ.
     */
    @GetMapping("/sessions/{sessionId}")
    public ApiResponse<AssignmentSessionResponse> getAssignmentSession(@PathVariable String sessionId) {
        return ApiResponse.<AssignmentSessionResponse>builder()
                .result(channelService.getAssignmentSession(sessionId))
                .message("Assignment session retrieved successfully")
                .build();
    }

    /**
     * Lấy tất cả phiên làm bài thuộc một section.
     */
    @GetMapping("/sessions/section/{sectionId}")
    public ApiResponse<List<AssignmentSessionResponse>> getSessionsBySection(@PathVariable String sectionId) {
        return ApiResponse.<List<AssignmentSessionResponse>>builder()
                .result(channelService.getAssignmentSessionsBySection(sectionId))
                .message("Assignment sessions retrieved successfully")
                .build();
    }

    // ══════════════════════════════════════════════════════════════════
    // UC-41: Score collection — thu thập điểm cuối sau chấm chéo
    // ══════════════════════════════════════════════════════════════════

    /**
     * Giáo viên retry thu thập điểm thủ công (khi auto-collect thất bại).
     * Idempotent: nếu đã COLLECTED thì trả về kết quả cũ.
     */
    @PostMapping("/sessions/{sessionId}/collect-scores")
    public ApiResponse<List<GroupFinalScoreResponse>> collectScores(@PathVariable String sessionId) {
        List<GroupFinalScore> scores = scoreCollectionService.collectAndCalculate(sessionId);
        List<GroupFinalScoreResponse> responses = scores.stream()
                .map(this::toGroupFinalScoreResponse)
                .toList();
        return ApiResponse.<List<GroupFinalScoreResponse>>builder()
                .result(responses)
                .message("Scores collected successfully")
                .build();
    }

    /**
     * Lấy kết quả điểm cuối của một session (đọc từ GroupFinalScore đã lưu).
     */
    @GetMapping("/sessions/{sessionId}/scores")
    public ApiResponse<List<GroupFinalScoreResponse>> getSessionScores(@PathVariable String sessionId) {
        List<GroupFinalScore> scores = scoreCollectionService.getSessionScores(sessionId);
        List<GroupFinalScoreResponse> responses = scores.stream()
                .map(this::toGroupFinalScoreResponse)
                .toList();
        return ApiResponse.<List<GroupFinalScoreResponse>>builder()
                .result(responses)
                .message("Session scores retrieved successfully")
                .build();
    }

    /**
     * Giáo viên xác nhận gửi điểm sang LMS (course-service qua Kafka).
     * Chỉ gọi được sau khi đã collect (COLLECTED hoặc SENT_TO_LMS).
     * Idempotent: cho phép gửi lại sau khi chỉnh sửa điểm thủ công.
     */
    @PostMapping("/sessions/{sessionId}/send-scores-to-lms")
    public ApiResponse<List<GroupFinalScoreResponse>> sendScoresToLms(@PathVariable String sessionId) {
        List<GroupFinalScore> scores = scoreCollectionService.sendScoresToLms(sessionId);
        List<GroupFinalScoreResponse> responses = scores.stream()
                .map(this::toGroupFinalScoreResponse)
                .toList();
        return ApiResponse.<List<GroupFinalScoreResponse>>builder()
                .result(responses)
                .message("Scores sent to LMS successfully")
                .build();
    }

    /**
     * [DEV/TEST ONLY] Reset scoreCollectionStatus về null + xóa GroupFinalScore cũ để force recompute.
     * Gọi endpoint này rồi gọi lại collect-scores để tính lại từ đầu.
     */
    @PostMapping("/sessions/{sessionId}/reset-collection")
    public ApiResponse<Void> resetScoreCollection(@PathVariable String sessionId) {
        scoreCollectionService.resetScoreCollection(sessionId);
        return ApiResponse.<Void>builder()
                .message("Score collection reset successfully — call collect-scores to recompute")
                .build();
    }

    /**
     * Giáo viên chỉnh sửa điểm cuối của một nhóm (ghi đè finalScore thủ công).
     * Đặt manuallyOverridden = true; không tính lại từ peer scores.
     */
    @PutMapping("/sessions/{sessionId}/scores/{channelId}")
    public ApiResponse<GroupFinalScoreResponse> updateGroupScore(
            @PathVariable String sessionId,
            @PathVariable String channelId,
            @Valid @RequestBody UpdateGroupScoreRequest request) {
        GroupFinalScore updated = scoreCollectionService.updateGroupFinalScore(
                sessionId, channelId, request.getFinalScore());
        return ApiResponse.<GroupFinalScoreResponse>builder()
                .result(toGroupFinalScoreResponse(updated))
                .message("Group score updated successfully")
                .build();
    }

    private GroupFinalScoreResponse toGroupFinalScoreResponse(GroupFinalScore s) {
        List<GroupFinalScoreResponse.PeerScoreEntryResponse> peers = s.getPeerScores() == null
                ? List.of()
                : s.getPeerScores().stream()
                        .map(p -> GroupFinalScoreResponse.PeerScoreEntryResponse.builder()
                                .reviewerChannelId(p.getReviewerChannelId())
                                .score(p.getScore())
                                .comment(p.getComment())
                                .submittedAt(p.getSubmittedAt())
                                .build())
                        .toList();
        return GroupFinalScoreResponse.builder()
                .id(s.getId())
                .assignmentSessionId(s.getAssignmentSessionId())
                .channelId(s.getChannelId())
                .sectionId(s.getSectionId())
                .peerScores(peers)
                .selfScore(s.getSelfScore())
                .medianPeerScore(s.getMedianPeerScore())
                .finalScore(s.getFinalScore())
                .usedSelfScore(s.isUsedSelfScore())
                .reviewerCount(peers.size())
                .memberUserIds(s.getMemberUserIds())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .calculatedAt(s.getCalculatedAt())
                .sentToLmsAt(s.getSentToLmsAt())
                .manuallyOverridden(s.isManuallyOverridden())
                .build();
    }
}
