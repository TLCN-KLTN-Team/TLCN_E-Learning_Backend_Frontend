package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.CreateCommentRequest;
import demo.app.chat_app.dto.request.CreatePostRequest;
import demo.app.chat_app.dto.request.VoteRequest;
import demo.app.chat_app.dto.response.PostResponse;
import demo.app.chat_app.model.forum.Category;
import demo.app.chat_app.model.forum.Comment;
import demo.app.chat_app.model.forum.Post;
import demo.app.chat_app.service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;
    private final SimpMessagingTemplate messagingTemplate;

    // Categories
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
            @PageableDefault(size = 10) Pageable pageable) {
        if (categoryId != null && !categoryId.isEmpty()) {
            return ResponseEntity.ok(forumService.getPostsByCategory(categoryId, pageable));
        }
        if (tag != null && !tag.isEmpty()) {
            return ResponseEntity.ok(forumService.getPostsByTag(tag, pageable));
        }
        return ResponseEntity.ok(forumService.getPosts(pageable));
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

    // Comments
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Comment> createComment(
            @PathVariable String postId,
            @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Force postId from path to match request (or just use path)
        if (!postId.equals(request.getPostId())) {
             // Basic validation, could throw error
        }
        Comment createdComment = forumService.createComment(request, userId);
        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/comments", createdComment);
        return ResponseEntity.ok(createdComment);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String postId) {
        return ResponseEntity.ok(forumService.getCommentsForPost(postId));
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
}
