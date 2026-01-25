package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CreateCommentRequest;
import demo.app.chat_app.dto.request.CreatePostRequest;
import demo.app.chat_app.dto.request.VoteRequest;
import demo.app.chat_app.dto.response.PostResponse;
import demo.app.chat_app.model.forum.*;
import demo.app.chat_app.repository.forum.CategoryRepository;
import demo.app.chat_app.repository.forum.CommentRepository;
import demo.app.chat_app.repository.forum.PostRepository;
import demo.app.chat_app.repository.forum.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForumService {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final MongoTemplate mongoTemplate;

    public Category createCategory(Category category) {
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Post createPost(CreatePostRequest request, String userId) {
        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .categoryId(request.getCategoryId())
                .userId(userId)
                .authorName(request.getAuthorName())
                .authorAvatar(request.getAuthorAvatar())
                .tags(request.getTags())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .viewCount(0)
                .score(0)
                .commentCount(0)
                .build();
        return postRepository.save(post);
    }

    public Page<Post> getPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }
    
    public Page<Post> getPostsByCategory(String categoryId, Pageable pageable) {
        return postRepository.findByCategoryId(categoryId, pageable);
    }
    
    public Page<Post> getPostsByTag(String tag, Pageable pageable) {
        return postRepository.findByTagsIn(List.of(tag), pageable);
    }

    public List<String> getAllTags() {
        return mongoTemplate.query(Post.class)
                .distinct("tags")
                .as(String.class)
                .all();
    }

    public PostResponse getPostDetail(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Increment view count (async or simple update)
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        
        long upvotes = voteRepository.countByTargetIdAndTargetTypeAndType(postId, VoteTargetType.POST, VoteType.UP);
        long downvotes = voteRepository.countByTargetIdAndTargetTypeAndType(postId, VoteTargetType.POST, VoteType.DOWN);
        long comments = commentRepository.countByPostId(postId);
        
        boolean isLiked = false;
        if (userId != null && !userId.isEmpty()) {
             isLiked = voteRepository.findByUserIdAndTargetIdAndTargetType(userId, postId, VoteTargetType.POST)
                     .map(vote -> vote.getType() == VoteType.UP)
                     .orElse(false);
        }
        
        return PostResponse.builder()
                .post(post)
                .upvotes(upvotes)
                .downvotes(downvotes)
                .commentCount(comments)
                .isLiked(isLiked)
                .authorName(post.getAuthorName())
                .authorAvatar(post.getAuthorAvatar())
                .build();
    }

    public Comment createComment(CreateCommentRequest request, String userId) {
        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .replyToId(request.getReplyToId())
                .userId(userId)
                .authorName(request.getAuthorName())
                .authorAvatar(request.getAuthorAvatar())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Comment saved = commentRepository.save(comment);
        
        // Update post comment count (simplistic approach)
        Post post = postRepository.findById(request.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(post.getCommentCount() + 1);
            
            // Add commenter avatar if available
            if (request.getAuthorAvatar() != null && !request.getAuthorAvatar().isEmpty()) {
                List<String> avatars = post.getRecentCommenterAvatars();
                if (avatars == null) {
                    avatars = new java.util.ArrayList<>();
                }
                // Avoid duplicates if needed, or just let it push unique
                if (!avatars.contains(request.getAuthorAvatar())) {
                    avatars.add(request.getAuthorAvatar());
                    // Limit to last 3
                    if (avatars.size() > 3) {
                         avatars.remove(0); // Remove oldest
                    }
                    post.setRecentCommenterAvatars(avatars);
                }
            }
            
            postRepository.save(post);
        }
        
        return saved;
    }

    public List<Comment> getCommentsForPost(String postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    public void vote(VoteRequest request, String userId) {
        Optional<Vote> existingVote = voteRepository.findByUserIdAndTargetIdAndTargetType(
                userId, request.getTargetId(), request.getTargetType());

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getType() == request.getType()) {
                // Toggle off if same vote type (remove vote)
                voteRepository.delete(vote);
            } else {
                // Change vote type
                vote.setType(request.getType());
                voteRepository.save(vote);
            }
        } else {
            // New vote
            Vote newVote = Vote.builder()
                    .userId(userId)
                    .targetId(request.getTargetId())
                    .targetType(request.getTargetType())
                    .type(request.getType())
                    .build();
            voteRepository.save(newVote);
        }
    }

    public void deletePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        // Optional: Delete related comments and votes
        // commentRepository.deleteAllByPostId(postId);
        // voteRepository.deleteAllByTargetId(postId);

        postRepository.delete(post);
    }
}
