package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CreateCommentRequest;
import demo.app.chat_app.dto.request.NotificationMessage;
import demo.app.chat_app.dto.request.CreatePostRequest;
import demo.app.chat_app.dto.request.CreateReportRequest;
import demo.app.chat_app.dto.request.UpdatePostRequest;
import demo.app.chat_app.dto.request.VoteRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.dto.response.PostResponse;
import demo.app.chat_app.dto.response.ViolationReportResponse;
import demo.app.chat_app.model.forum.*;
import demo.app.chat_app.repository.forum.*;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.repository.httpclient.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForumService {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final ForumBookmarkRepository bookmarkRepository;
    private final ForumViolationReportRepository violationReportRepository;
    private final GetUserClient getUserClient;
    private final MongoTemplate mongoTemplate;
    private final NotificationRepository notificationRepository;
    private final Cloudinary cloudinary;

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
            .authorUsername(request.getAuthorUsername())
                .authorName(request.getAuthorName())
                .authorAvatar(request.getAuthorAvatar())
                .tags(request.getTags())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .viewCount(0)
                .score(0)
                .commentCount(0)
                .hundredUpvotesNotified(false)
                .build();
        return postRepository.save(post);
    }

    public Post updatePost(String postId, UpdatePostRequest request, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to edit this post");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            post.setTitle(request.getTitle().trim());
        }

        if (request.getContent() != null && !request.getContent().isBlank()) {
            post.setContent(request.getContent());
        }

        if (request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
            post.setCategoryId(request.getCategoryId().trim());
        }

        if (request.getTags() != null) {
            post.setTags(request.getTags());
        }
        post.setUpdatedAt(LocalDateTime.now());
        Post updated = postRepository.save(post);
        syncBookmarksForPost(updated);
        return updated;
    }

    public Page<Post> getPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }

    public Page<Post> getPosts(String categoryId, String tag, String search, String sortBy, Pageable pageable) {
        Criteria criteria = buildPostCriteria(categoryId, tag, search, sortBy);
        Sort sort = buildSort(sortBy);
        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Query query = new Query().with(effectivePageable);
        Query countQuery = new Query();

        if (criteria != null) {
            query.addCriteria(criteria);
            countQuery.addCriteria(criteria);
        }

        long total = mongoTemplate.count(countQuery, Post.class);
        List<Post> posts = mongoTemplate.find(query, Post.class);
        return new PageImpl<>(posts, effectivePageable, total);
    }
    
    public Page<Post> getPostsByCategory(String categoryId, Pageable pageable) {
        return postRepository.findByCategoryId(categoryId, pageable);
    }
    
    public Page<Post> getPostsByTag(String tag, Pageable pageable) {
        return postRepository.findByTagsIn(List.of(tag), pageable);
    }

    private Criteria buildPostCriteria(String categoryId, String tag, String search, String sortBy) {
        List<Criteria> criteriaList = new ArrayList<>();

        // Always exclude soft-deleted posts from public listing
        criteriaList.add(Criteria.where("deleted").ne(true));

        if (categoryId != null && !categoryId.isBlank()) {
            criteriaList.add(Criteria.where("categoryId").is(categoryId.trim()));
        }

        if (tag != null && !tag.isBlank()) {
            criteriaList.add(Criteria.where("tags").in(tag.trim()));
        }

        if (search != null && !search.isBlank()) {
            String escapedSearch = Pattern.quote(search.trim());
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("title").regex(escapedSearch, "i"),
                    Criteria.where("content").regex(escapedSearch, "i")
            ));
        }

        if ("unanswered".equalsIgnoreCase(sortBy)) {
            criteriaList.add(Criteria.where("commentCount").is(0L));
        }

        return new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));
    }

    private Sort buildSort(String sortBy) {
        if ("hot".equalsIgnoreCase(sortBy)) {
            return Sort.by(
                    Sort.Order.desc("isPinned"),
                    Sort.Order.desc("score"),
                    Sort.Order.desc("viewCount"),
                    Sort.Order.desc("createdAt")
            );
        }

        if ("unanswered".equalsIgnoreCase(sortBy)) {
            return Sort.by(
                    Sort.Order.desc("isPinned"),
                    Sort.Order.desc("createdAt")
            );
        }

        return Sort.by(
                Sort.Order.desc("isPinned"),
                Sort.Order.desc("createdAt")
        );
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

        // Reject soft-deleted posts for non-admin callers
        if (post.isDeleted()) {
            throw new RuntimeException("Post not found");
        }

        // NOTE: viewCount is incremented via a dedicated endpoint (POST /posts/{id}/view)
        // to avoid inflating views on every vote/reload.

        long upvotes = voteRepository.countByTargetIdAndTargetTypeAndType(postId, VoteTargetType.POST, VoteType.UP);
        long downvotes = voteRepository.countByTargetIdAndTargetTypeAndType(postId, VoteTargetType.POST, VoteType.DOWN);
        long comments = commentRepository.countByPostIdAndDeletedFalse(postId);

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

    /**
     * Increment view count for a post – called once per page visit via dedicated endpoint.
     * Separated from getPostDetail to prevent view inflation on vote/reload.
     */
    public long incrementViewCount(String postId) {
        Query query = Query.query(
                Criteria.where("_id").is(postId)
                        .and("deleted").ne(true)
        );
        Update update = new Update().inc("viewCount", 1);
        Post updatedPost = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                Post.class
        );

        if (updatedPost == null) {
            throw new RuntimeException("Post not found");
        }

        return updatedPost.getViewCount();
    }

    public List<Post> getBookmarkedPosts(String userId) {
        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ForumBookmark::getPost)
                .collect(Collectors.toList());
    }

    public boolean toggleBookmark(String postId, String userId) {
        Optional<ForumBookmark> existingBookmark = bookmarkRepository.findByUserIdAndPost_Id(userId, postId);
        if (existingBookmark.isPresent()) {
            bookmarkRepository.delete(existingBookmark.get());
            return false;
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        bookmarkRepository.save(ForumBookmark.builder()
                .userId(userId)
                .post(post)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return true;
    }

    public Comment createComment(CreateCommentRequest request, String userId) {
        Post post = postRepository.findById(request.getPostId())
            .orElseThrow(() -> new RuntimeException("Post not found"));

        // Check if post is locked
        if (post.isLocked()) {
            throw new RuntimeException("This post is locked and cannot receive new comments");
        }

        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .replyToId(request.getReplyToId())
                .userId(userId)
                .authorUsername(request.getAuthorUsername())
                .authorName(request.getAuthorName())
                .authorAvatar(request.getAuthorAvatar())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Comment saved = commentRepository.save(comment);
        
        // Update post comment count (simplistic approach)
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

        // Notify post author when someone comments
        if (!post.getUserId().equals(userId)) {
            sendForumNotification(
                    post.getUserId(),
                    userId,
                    String.format("%s da binh luan bai viet cua ban: \"%s\"", safeDisplayName(request.getAuthorName()), post.getTitle()),
                    "/forum/posts/" + post.getId() + "#comment-" + saved.getId()
            );
        }

        // Notify parent comment author when this is a reply
        if (request.getReplyToId() != null && !request.getReplyToId().isBlank()) {
            commentRepository.findById(request.getReplyToId()).ifPresent(parentComment -> {
                if (!parentComment.getUserId().equals(userId) && !parentComment.getUserId().equals(post.getUserId())) {
                    sendForumNotification(
                            parentComment.getUserId(),
                            userId,
                            String.format("%s da tra loi binh luan cua ban trong bai viet: \"%s\"", safeDisplayName(request.getAuthorName()), post.getTitle()),
                            "/forum/posts/" + post.getId() + "#comment-" + saved.getId()
                    );
                }
            });
        }

            // Notify mentioned users via @username (matched against forum participants)
            Set<String> mentionRecipients = extractMentionRecipients(request.getContent(), post, userId);
            mentionRecipients.forEach(recipientId ->
                sendForumNotification(
                    recipientId,
                    userId,
                    String.format("%s da nhac den ban trong mot binh luan: \"%s\"", safeDisplayName(request.getAuthorName()), post.getTitle()),
                    "/forum/posts/" + post.getId() + "#comment-" + saved.getId()
                )
            );
        
        return saved;
    }

    public List<Comment> getCommentsForPost(String postId, String userId) {
        // Only return non-deleted comments to regular users
        List<Comment> comments = commentRepository.findByPostIdAndDeletedFalseOrderByCreatedAtAsc(postId);
        comments.forEach(comment -> {
            long upvotes = voteRepository.countByTargetIdAndTargetTypeAndType(comment.getId(), VoteTargetType.COMMENT, VoteType.UP);
            long downvotes = voteRepository.countByTargetIdAndTargetTypeAndType(comment.getId(), VoteTargetType.COMMENT, VoteType.DOWN);
            boolean isLiked = false;
            if (userId != null && !userId.isBlank()) {
                isLiked = voteRepository.findByUserIdAndTargetIdAndTargetType(userId, comment.getId(), VoteTargetType.COMMENT)
                        .map(vote -> vote.getType() == VoteType.UP)
                        .orElse(false);
            }

            comment.setUpvotes(upvotes);
            comment.setDownvotes(downvotes);
            comment.setScore(upvotes - downvotes);
            comment.setLiked(isLiked);
        });

        return sortCommentsByThreadAndScore(comments);
    }

    public Comment updateComment(String postId, String commentId, String content, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to edit this comment");
        }

        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    public void deleteComment(String postId, String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<String, List<Comment>> childrenByParentId = new HashMap<>();
        for (Comment current : allComments) {
            if (current.getReplyToId() != null && !current.getReplyToId().isBlank()) {
                childrenByParentId.computeIfAbsent(current.getReplyToId(), key -> new ArrayList<>()).add(current);
            }
        }

        Set<String> commentIdsToDelete = new HashSet<>();
        Deque<String> pendingIds = new ArrayDeque<>();
        pendingIds.add(commentId);

        while (!pendingIds.isEmpty()) {
            String currentId = pendingIds.removeFirst();
            if (!commentIdsToDelete.add(currentId)) {
                continue;
            }

            List<Comment> childComments = childrenByParentId.get(currentId);
            if (childComments == null) {
                continue;
            }

            for (Comment childComment : childComments) {
                pendingIds.addLast(childComment.getId());
            }
        }

        commentRepository.deleteAllById(commentIdsToDelete);
        voteRepository.deleteByTargetIdInAndTargetType(commentIdsToDelete, VoteTargetType.COMMENT);

        Post post = postRepository.findById(postId).orElse(null);
        if (post != null) {
            List<Comment> remainingComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
            post.setCommentCount(remainingComments.size());

            List<String> avatars = new ArrayList<>();
            for (Comment remainingComment : remainingComments) {
                String avatar = remainingComment.getAuthorAvatar();
                if (avatar == null || avatar.isBlank() || avatars.contains(avatar)) {
                    continue;
                }

                avatars.add(avatar);
                if (avatars.size() >= 3) {
                    break;
                }
            }

            post.setRecentCommenterAvatars(avatars);
            postRepository.save(post);
        }
    }

    public void vote(VoteRequest request, String userId) {
        // Prevent users from voting on their own posts or comments
        if (request.getTargetType() == VoteTargetType.POST) {
            postRepository.findById(request.getTargetId()).ifPresent(post -> {
                if (post.getUserId() != null && post.getUserId().equals(userId)) {
                    throw new RuntimeException("Bạn không thể vote bài viết của chính mình");
                }
            });
        } else if (request.getTargetType() == VoteTargetType.COMMENT) {
            commentRepository.findById(request.getTargetId()).ifPresent(comment -> {
                if (comment.getUserId() != null && comment.getUserId().equals(userId)) {
                    throw new RuntimeException("Bạn không thể vote bình luận của chính mình");
                }
            });
        }

        Optional<Vote> existingVote = voteRepository.findByUserIdAndTargetIdAndTargetType(
                userId, request.getTargetId(), request.getTargetType());

        boolean shouldNotifyPostAuthor = request.getTargetType() == VoteTargetType.POST
            && request.getType() == VoteType.UP
            && (existingVote.isEmpty() || existingVote.get().getType() != VoteType.UP);

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

        if (shouldNotifyPostAuthor) {
            postRepository.findById(request.getTargetId()).ifPresent(post -> {
                if (!post.getUserId().equals(userId)) {
                    sendForumNotification(
                            post.getUserId(),
                            userId,
                            "Mot thanh vien da thich bai viet cua ban: \"" + post.getTitle() + "\"",
                            "/forum/posts/" + post.getId()
                    );
                }

                long upvotes = voteRepository.countByTargetIdAndTargetTypeAndType(post.getId(), VoteTargetType.POST, VoteType.UP);
                long downvotes = voteRepository.countByTargetIdAndTargetTypeAndType(post.getId(), VoteTargetType.POST, VoteType.DOWN);
                post.setScore(upvotes - downvotes);

                if (upvotes >= 100 && !post.isHundredUpvotesNotified()) {
                    sendForumNotification(
                            post.getUserId(),
                            userId,
                            "Bai viet cua ban da dat 100 upvotes!",
                            "/forum/posts/" + post.getId()
                    );
                    post.setHundredUpvotesNotified(true);
                }

                postRepository.save(post);
            });
        } else if (request.getTargetType() == VoteTargetType.POST) {
            postRepository.findById(request.getTargetId()).ifPresent(post -> {
                long upvotes = voteRepository.countByTargetIdAndTargetTypeAndType(post.getId(), VoteTargetType.POST, VoteType.UP);
                long downvotes = voteRepository.countByTargetIdAndTargetTypeAndType(post.getId(), VoteTargetType.POST, VoteType.DOWN);
                post.setScore(upvotes - downvotes);
                postRepository.save(post);
            });
        }
    }

    private String safeDisplayName(String authorName) {
        if (authorName == null || authorName.isBlank()) {
            return "Mot thanh vien";
        }
        return authorName;
    }

    private void sendForumNotification(String recipientId, String senderId, String message, String link) {
        try {
            notificationRepository.sendNotification(NotificationMessage.builder()
                    .userId(recipientId)
                    .senderId(senderId)
                    .type("NOTIFICATION")
                    .message(message)
                    .link(link)
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to send forum notification to recipientId={}: {}", recipientId, ex.getMessage());
        }
    }

    private void notifySuperAdminsAboutReport(ForumViolationReport report, String reporterId) {
        try {
            List<UserResponse> superAdmins = getUserClient.getUsersByRole("SUPER_ADMIN").getResult();
            if (superAdmins == null || superAdmins.isEmpty()) {
                log.warn("No SUPER_ADMIN users found for report notification: reportId={}", report.getId());
                return;
            }

            String targetLabel = report.getTargetType() != null ? report.getTargetType().name().toLowerCase() : "content";
            String message = String.format("Có báo cáo vi phạm mới cho %s: %s", targetLabel, report.getReason());
            String link = "/system-admin/notifications";

            for (UserResponse superAdmin : superAdmins) {
                if (superAdmin.getId() == null || superAdmin.getId().isBlank()) {
                    continue;
                }
                sendForumNotification(superAdmin.getId(), reporterId, message, link);
            }
        } catch (Exception ex) {
            log.warn("Failed to notify SUPER_ADMIN users about reportId={}: {}", report.getId(), ex.getMessage());
        }
    }

    private Set<String> extractMentionRecipients(String content, Post post, String actorUserId) {
        if (content == null || content.isBlank()) {
            return Set.of();
        }

        Pattern mentionPattern = Pattern.compile("@([\\p{L}0-9._-]{2,})", Pattern.UNICODE_CHARACTER_CLASS);
        Matcher matcher = mentionPattern.matcher(content);

        Set<String> mentionTokens = new HashSet<>();
        while (matcher.find()) {
            mentionTokens.add(normalizeMentionToken(matcher.group(1)));
        }

        if (mentionTokens.isEmpty()) {
            return Set.of();
        }

        Map<String, String> nameToUserId = new HashMap<>();
        addMentionTokensForUser(nameToUserId, post.getUserId(), post.getAuthorName(), post.getAuthorUsername());

        List<Comment> existingComments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        existingComments.forEach(comment -> {
            addMentionTokensForUser(nameToUserId, comment.getUserId(), comment.getAuthorName(), comment.getAuthorUsername());
        });

        return mentionTokens.stream()
                .map(nameToUserId::get)
                .filter(id -> id != null && !id.equals(actorUserId))
                .collect(Collectors.toSet());
    }

    private String normalizeMentionToken(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase();
    }

    private void addMentionTokensForUser(Map<String, String> nameToUserId, String userId, String fallbackName, String authorUsername) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        if (authorUsername != null && !authorUsername.isBlank()) {
            nameToUserId.put(normalizeMentionToken(authorUsername), userId);
        }

        if (fallbackName != null && !fallbackName.isBlank()) {
            nameToUserId.put(normalizeMentionToken(fallbackName), userId);
        }

        try {
            UserResponse profile = getUserClient.getUser(userId).getResult();
            if (profile == null) {
                return;
            }

            if (profile.getNickname() != null && !profile.getNickname().isBlank()) {
                nameToUserId.put(normalizeMentionToken(profile.getNickname()), userId);
            }

            if (profile.getUsername() != null && !profile.getUsername().isBlank()) {
                nameToUserId.put(normalizeMentionToken(profile.getUsername()), userId);
            }

            if (profile.getStudentId() != null && !profile.getStudentId().isBlank()) {
                nameToUserId.put(normalizeMentionToken(profile.getStudentId()), userId);
            }
        } catch (Exception ex) {
            log.debug("Unable to resolve mention tokens for userId={}: {}", userId, ex.getMessage());
        }
    }

    private List<Comment> sortCommentsByThreadAndScore(List<Comment> comments) {
        Map<String, List<Comment>> childrenMap = new HashMap<>();
        List<Comment> roots = new ArrayList<>();

        for (Comment comment : comments) {
            if (comment.getReplyToId() == null || comment.getReplyToId().isBlank()) {
                roots.add(comment);
            } else {
                childrenMap.computeIfAbsent(comment.getReplyToId(), key -> new ArrayList<>()).add(comment);
            }
        }

        Comparator<Comment> comparator = Comparator
                .comparingLong(Comment::getScore).reversed()
                .thenComparing(Comment::getCreatedAt);

        roots.sort(comparator);
        childrenMap.values().forEach(list -> list.sort(comparator));

        List<Comment> flattened = new ArrayList<>();
        for (Comment root : roots) {
            flattened.add(root);
            appendChildrenDepthFirst(root.getId(), childrenMap, flattened);
        }

        return flattened;
    }

    private void appendChildrenDepthFirst(String parentId, Map<String, List<Comment>> childrenMap, List<Comment> result) {
        List<Comment> children = childrenMap.get(parentId);
        if (children == null || children.isEmpty()) {
            return;
        }

        for (Comment child : children) {
            result.add(child);
            appendChildrenDepthFirst(child.getId(), childrenMap, result);
        }
    }

    public void deletePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        bookmarkRepository.deleteByPost_Id(postId);
        postRepository.delete(post);
    }

    private void syncBookmarksForPost(Post updatedPost) {
        List<ForumBookmark> bookmarks = bookmarkRepository.findByPost_Id(updatedPost.getId());
        if (bookmarks.isEmpty()) {
            return;
        }

        bookmarks.forEach(bookmark -> {
            bookmark.setPost(updatedPost);
            bookmark.setUpdatedAt(LocalDateTime.now());
        });
        bookmarkRepository.saveAll(bookmarks);
    }

    // ==================== MODERATION METHODS ====================

    /**
     * Report a post or comment violation
     */
    public ForumViolationReport reportViolation(CreateReportRequest request, String reporterId) {
        ForumViolationReport report = ForumViolationReport.builder()
                .reporterId(reporterId)
                .targetId(request.getTargetId())
                .targetType(request.getTargetType())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .build();

        ForumViolationReport savedReport = violationReportRepository.save(report);
        notifySuperAdminsAboutReport(savedReport, reporterId);
        return savedReport;
    }

    /**
     * Get pending violation reports (for SuperAdmin moderation queue)
     */
    public Page<ViolationReportResponse> getPendingReports(Pageable pageable) {
        Page<ForumViolationReport> reports = violationReportRepository.findByStatusAndDeletedFalse(ReportStatus.PENDING, pageable);
        return reports.map(this::mapToViolationReportResponse);
    }

    /**
     * Get all reports with optional filtering
     */
    public Page<ViolationReportResponse> getAllReports(ReportStatus status, Pageable pageable) {
        Page<ForumViolationReport> reports;
        if (status != null) {
            reports = violationReportRepository.findByStatusAndDeletedFalse(status, pageable);
        } else {
            reports = violationReportRepository.findAll(pageable);
        }
        return reports.map(this::mapToViolationReportResponse);
    }

    /**
     * Update report status (SuperAdmin action)
     */
    public ForumViolationReport updateReportStatus(String reportId, ReportStatus newStatus, String moderatorId, String moderatorNotes) {
        ForumViolationReport report = violationReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(newStatus);
        report.setModeratorId(moderatorId);
        report.setModeratorNotes(moderatorNotes);
        report.setUpdatedAt(LocalDateTime.now());

        return violationReportRepository.save(report);
    }

    /**
     * Pin a post (SuperAdmin only)
     */
    public Post pinPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setPinned(true);
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    /**
     * Unpin a post (SuperAdmin only)
     */
    public Post unpinPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setPinned(false);
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    /**
     * Lock a post (disable comments)
     */
    public Post lockPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setLocked(true);
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    /**
     * Unlock a post (enable comments)
     */
    public Post unlockPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setLocked(false);
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    /**
     * Soft delete a post (for audit trail)
     */
    public Post softDeletePost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setDeleted(true);
        post.setDeletedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    /**
     * Soft delete a comment (for audit trail)
     */
    public Comment softDeleteComment(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        comment.setDeleted(true);
        comment.setDeletedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        commentRepository.save(comment);

        // Update post's comment count to reflect the soft deletion
        postRepository.findById(comment.getPostId()).ifPresent(post -> {
            long remaining = commentRepository.countByPostIdAndDeletedFalse(comment.getPostId());
            post.setCommentCount(remaining);
            postRepository.save(post);
        });

        return comment;
    }

    /**
     * Get reports for a specific post or comment
     */
    public List<ViolationReportResponse> getReportsForTarget(String targetId) {
        List<ForumViolationReport> reports = violationReportRepository.findByTargetIdAndDeletedFalse(targetId);
        return reports.stream()
                .map(this::mapToViolationReportResponse)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to map ForumViolationReport to ViolationReportResponse
     */
    private ViolationReportResponse mapToViolationReportResponse(ForumViolationReport report) {
        String reporterName = "Người dùng ẩn danh";
        try {
            ApiResponse<UserResponse> userResponse = getUserClient.getUser(report.getReporterId());
            if (userResponse != null && userResponse.getResult() != null) {
                String nickname = userResponse.getResult().getNickname();
                if (nickname != null && !nickname.isBlank()) {
                    reporterName = nickname;
                } else if (userResponse.getResult().getUsername() != null && !userResponse.getResult().getUsername().isBlank()) {
                    reporterName = userResponse.getResult().getUsername();
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch reporter name for reporterId={}: {}", report.getReporterId(), ex.getMessage());
        }
        
        return ViolationReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporterId())
                .reporterName(reporterName)
                .targetId(report.getTargetId())
                .targetType(report.getTargetType())
                .reason(report.getReason())
                .notes(report.getNotes())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .status(report.getStatus())
                .moderatorId(report.getModeratorId())
                .moderatorNotes(report.getModeratorNotes())
                .build();
    }

    /**
     * Upload an image for forum posts or comments to Cloudinary.
     * Returns a map with {"url": "...", "location": "..."}  ––  TinyMCE expects the "location" key.
     */
    public Map<String, String> uploadForumImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        try {
            java.util.Map<String, Object> uploadParams = new java.util.HashMap<>();
            uploadParams.put("resource_type", "image");
            uploadParams.put("public_id", "forum_" + System.currentTimeMillis());
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");
            uploadParams.put("quality", "auto");
            uploadParams.put("fetch_format", "auto");

            java.util.Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, String> result = new java.util.HashMap<>();
            String url = uploadResult.get("secure_url").toString();
            result.put("url", url);
            result.put("location", url); // TinyMCE images_upload_handler reads "location"
            result.put("publicId", uploadResult.get("public_id").toString());

            log.info("Forum image uploaded: {}", url);
            return result;
        } catch (Exception e) {
            log.error("Error uploading forum image", e);
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
}
