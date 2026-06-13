package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.CreateCommentRequest;
import demo.app.chat_app.dto.request.CreatePostRequest;
import demo.app.chat_app.dto.request.CreateReportRequest;
import demo.app.chat_app.dto.request.ModerationActionRequest;
import demo.app.chat_app.dto.request.UpdateCommentRequest;
import demo.app.chat_app.dto.request.UpdatePostRequest;
import demo.app.chat_app.dto.request.VoteRequest;
import demo.app.chat_app.dto.response.BookmarkToggleResponse;
import demo.app.chat_app.dto.response.PostResponse;
import demo.app.chat_app.dto.response.ViolationReportResponse;
import demo.app.chat_app.model.forum.Category;
import demo.app.chat_app.model.forum.Comment;
import demo.app.chat_app.model.forum.ForumViolationReport;
import demo.app.chat_app.model.forum.Post;
import demo.app.chat_app.model.forum.ReportStatus;
import demo.app.chat_app.service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;
    private final SimpMessagingTemplate messagingTemplate;

    // Categories
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(forumService.createCategory(category));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(forumService.getAllCategories());
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(forumService.getAllTags());
    }

    // Posts
    @PostMapping("/posts")
    public ResponseEntity<Post> createPost(@RequestBody CreatePostRequest request, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject(); // Assuming subject is userId
        Post createdPost = forumService.createPost(request, userId);
        messagingTemplate.convertAndSend("/topic/forum/posts", createdPost);
        return ResponseEntity.ok(createdPost);
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<Post>> getPosts(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(forumService.getPosts(categoryId, tag, search, sortBy, pageable));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostResponse> getPostDetail(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        String userId = (jwt != null) ? jwt.getSubject() : null;
        return ResponseEntity.ok(forumService.getPostDetail(postId, userId));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        forumService.deletePost(postId, userId);
        messagingTemplate.convertAndSend("/topic/forum/posts/delete", postId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Increment view count once per page visit.
     * Separated from getPostDetail to avoid inflating views on every vote/WebSocket reload.
     */
    @PostMapping("/posts/{postId}/view")
    public ResponseEntity<Map<String, Object>> incrementViewCount(@PathVariable String postId) {
        long viewCount = forumService.incrementViewCount(postId);
        Map<String, Object> update = Map.of(
                "type", "view_update",
                "postId", postId,
                "viewCount", viewCount
        );

        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/update", update);
        messagingTemplate.convertAndSend("/topic/forum/posts/view", update);

        return ResponseEntity.ok(update);
    }

    /**
     * Upload image for use inside TinyMCE forum posts or comments.
     * Returns {"location": "<cloudinary_url>"} as expected by TinyMCE images_upload_handler.
     */
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadForumImage(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(forumService.uploadForumImage(file));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<Post>> getBookmarkedPosts(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(forumService.getBookmarkedPosts(userId));
    }

    @PostMapping("/posts/{postId}/bookmark")
    public ResponseEntity<BookmarkToggleResponse> toggleBookmark(
            @PathVariable String postId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        boolean bookmarked = forumService.toggleBookmark(postId, userId);
        return ResponseEntity.ok(BookmarkToggleResponse.builder().bookmarked(bookmarked).build());
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<Post> updatePost(
            @PathVariable String postId,
            @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(forumService.updatePost(postId, request, userId));
    }

    // Comments
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Comment> createComment(
            @PathVariable String postId,
            @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Enforce that the postId in the request body matches the path variable
        if (request.getPostId() == null || !postId.equals(request.getPostId())) {
            return ResponseEntity.badRequest().build();
        }
        Comment createdComment = forumService.createComment(request, userId);
        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/comments", createdComment);
        return ResponseEntity.ok(createdComment);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        String userId = (jwt != null) ? jwt.getSubject() : null;
        return ResponseEntity.ok(forumService.getCommentsForPost(postId, userId));
    }

    @PutMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<Comment> updateComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(forumService.updateComment(postId, commentId, request.getContent(), userId));
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        forumService.deleteComment(postId, commentId, userId);
        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/comments/delete", commentId);
        return ResponseEntity.noContent().build();
    }

    // Interactions
    @PostMapping("/interactions/vote")
    public ResponseEntity<Void> vote(@RequestBody VoteRequest request, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        forumService.vote(request, userId);
        // Optimize: Send updated stats instead of full reload signal
        messagingTemplate.convertAndSend("/topic/posts/" + request.getTargetId() + "/update", "vote_update");
        return ResponseEntity.ok().build();
    }

    // ==================== MODERATION ENDPOINTS ====================

    /**
     * Report a post or comment violation
     * Anyone can report
     */
    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<ForumViolationReport> reportPost(
            @PathVariable String postId,
            @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String reporterId = jwt.getSubject();
        request.setTargetId(postId);
        ForumViolationReport report = forumService.reportViolation(request, reporterId);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<ForumViolationReport> reportComment(
            @PathVariable String commentId,
            @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String reporterId = jwt.getSubject();
        request.setTargetId(commentId);
        ForumViolationReport report = forumService.reportViolation(request, reporterId);
        return ResponseEntity.ok(report);
    }

    /**
     * Get pending violation reports (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/moderation/reports")
    public ResponseEntity<Page<ViolationReportResponse>> getPendingReports(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(forumService.getPendingReports(pageable));
    }

    /**
     * Get all reports with optional status filter (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/moderation/reports/all")
    public ResponseEntity<Page<ViolationReportResponse>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(forumService.getAllReports(status, pageable));
    }

    /**
     * Update report status (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/moderation/reports/{reportId}/status")
    public ResponseEntity<ForumViolationReport> updateReportStatus(
            @PathVariable String reportId,
            @RequestParam ReportStatus status,
            @RequestBody(required = false) String moderatorNotes,
            @AuthenticationPrincipal Jwt jwt) {
        String moderatorId = jwt.getSubject();
        ForumViolationReport report = forumService.updateReportStatus(reportId, status, moderatorId, moderatorNotes);
        return ResponseEntity.ok(report);
    }

    /**
     * Pin a post (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/moderation/posts/{postId}/pin")
    public ResponseEntity<Post> pinPost(@PathVariable String postId) {
        return ResponseEntity.ok(forumService.pinPost(postId));
    }

    /**
     * Unpin a post (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/moderation/posts/{postId}/unpin")
    public ResponseEntity<Post> unpinPost(@PathVariable String postId) {
        return ResponseEntity.ok(forumService.unpinPost(postId));
    }

    /**
     * Lock a post (disable comments) - SuperAdmin only
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/moderation/posts/{postId}/lock")
    public ResponseEntity<Post> lockPost(@PathVariable String postId) {
        return ResponseEntity.ok(forumService.lockPost(postId));
    }

    /**
     * Unlock a post (enable comments) - SuperAdmin only
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/moderation/posts/{postId}/unlock")
    public ResponseEntity<Post> unlockPost(@PathVariable String postId) {
        return ResponseEntity.ok(forumService.unlockPost(postId));
    }

    /**
     * Soft delete a post (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/moderation/posts/{postId}")
    public ResponseEntity<Void> softDeletePost(@PathVariable String postId) {
        forumService.softDeletePost(postId);
        messagingTemplate.convertAndSend("/topic/forum/posts/delete", postId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Soft delete a comment (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/moderation/comments/{commentId}")
    public ResponseEntity<Void> softDeleteComment(@PathVariable String commentId) {
        forumService.softDeleteComment(commentId);
        messagingTemplate.convertAndSend("/topic/forum/comments/delete", commentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get reports for a specific post or comment (SuperAdmin only)
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/{targetId}/reports")
    public ResponseEntity<List<ViolationReportResponse>> getReportsForTarget(@PathVariable String targetId) {
        return ResponseEntity.ok(forumService.getReportsForTarget(targetId));
    }
}
