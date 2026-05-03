package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.DiscussionMessageRequest;
import demo.app.chat_app.dto.response.DiscussionMessageResponse;
import demo.app.chat_app.model.LessonMessage;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.DiscussionReadStatus;
import demo.app.chat_app.repository.DiscussionReadStatusRepository;
import demo.app.chat_app.repository.LessonDiscussionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonDiscussionService {
    
    private final LessonDiscussionRepository discussionRepository;
    private final DiscussionReadStatusRepository readStatusRepository;
    private final Cloudinary cloudinary;

    public Page<DiscussionMessageResponse> getDiscussionMessages(Integer lessonId, Pageable pageable) {
        log.info("Fetching discussion messages for lesson: {}", lessonId);
        
        Page<LessonMessage> messages = discussionRepository
                .findByLessonIdAndIsDeletedFalseOrderByCreatedAtAsc(lessonId, pageable);
        
        return messages.map(this::toResponse);
    }

    public DiscussionMessageResponse postMessage(Integer lessonId, DiscussionMessageRequest request) {
        String currentUserId = getCurrentUserId();
        log.info("User {} posting message to lesson {} discussion", currentUserId, lessonId);
        
        String userName = request.getUserName() != null ? request.getUserName() : "User";
        String userAvatar = request.getUserAvatar();
        String userRole = "STUDENT"; // TODO: Get from authentication
        
        LessonMessage message = LessonMessage.builder()
                .lessonId(lessonId)
                .userId(currentUserId)
                .userName(userName)
                .userAvatar(userAvatar)
                .userRole(userRole)
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .parentMessageId(request.getParentMessageId())
                .createdAt(LocalDateTime.now())
                .isDeleted(false)
                .build();
        
        LessonMessage saved = discussionRepository.save(message);
        log.info("Discussion message saved with ID: {}", saved.getId());
        
        return toResponse(saved);
    }

    public Integer deleteMessage(String messageId) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting message: {}", currentUserId, messageId);
        
        LessonMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
        
        // Check if user is owner or admin
        if (!message.getUserId().equals(currentUserId) && !isAdmin()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        
        message.setIsDeleted(true);
        message.setUpdatedAt(LocalDateTime.now());
        discussionRepository.save(message);
        
        return message.getLessonId();
    }

    public DiscussionMessageResponse toggleLike(String messageId) {
        String currentUserId = getCurrentUserId();
        log.info("User {} toggling like for message: {}", currentUserId, messageId);
        
        LessonMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
        
        if (message.getLikedByUserIds().contains(currentUserId)) {
            message.getLikedByUserIds().remove(currentUserId);
        } else {
            message.getLikedByUserIds().add(currentUserId);
        }
        
        message.setUpdatedAt(LocalDateTime.now());
        LessonMessage saved = discussionRepository.save(message);
        
        return toResponse(saved);
    }

    public Long getUnreadCount(Integer lessonId) {
        String currentUserId = getCurrentUserId();
        log.info("Getting unread count for lesson {} and user {}", lessonId, currentUserId);
        
        var readStatus = readStatusRepository
                .findByUserIdAndItemTypeAndItemId(currentUserId, "lesson", lessonId);
        
        if (readStatus.isEmpty()) {
            return discussionRepository.countByLessonIdAndIsDeletedFalse(lessonId);
        }
        
        LocalDateTime lastReadAt = readStatus.get().getLastReadAt();
        return discussionRepository.countByLessonIdAndCreatedAtAfterAndIsDeletedFalse(lessonId, lastReadAt);
    }

    public void markAsRead(Integer lessonId) {
        String currentUserId = getCurrentUserId();
        log.info("User {} marking lesson {} discussion as read", currentUserId, lessonId);
        
        var readStatus = readStatusRepository
                .findByUserIdAndItemTypeAndItemId(currentUserId, "lesson", lessonId)
                .orElse(DiscussionReadStatus.builder()
                        .userId(currentUserId)
                        .itemType("lesson")
                        .itemId(lessonId)
                        .build());
        
        readStatus.setLastReadAt(LocalDateTime.now());
        readStatusRepository.save(readStatus);
    }

    private DiscussionMessageResponse toResponse(LessonMessage message) {
        String currentUserId = getCurrentUserId();
        
        List<DiscussionMessageResponse> replies = null;
        if (message.getParentMessageId() == null) {
            replies = discussionRepository
                    .findByParentMessageIdAndIsDeletedFalseOrderByCreatedAtAsc(message.getId())
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        
        return DiscussionMessageResponse.builder()
                .id(message.getId())
                .lessonId(message.getLessonId())
                .userId(message.getUserId())
                .userName(message.getUserName())
                .userAvatar(message.getUserAvatar())
                .userRole(message.getUserRole())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .likes(message.getLikedByUserIds().size())
                .isLiked(message.getLikedByUserIds().contains(currentUserId))
                .isOwner(message.getUserId().equals(currentUserId))
                .parentMessageId(message.getParentMessageId())
                .replies(replies)
                .isDeleted(message.getIsDeleted())
                .build();
    }

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    private boolean isAdmin() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && 
               authentication.getAuthorities().stream()
                       .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public Map<String, String> uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        try {
            java.util.Map<String, Object> uploadParams = new java.util.HashMap<>();
            uploadParams.put("resource_type", "image");
            uploadParams.put("public_id", "discussion_" + System.currentTimeMillis());
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");
            uploadParams.put("quality", "auto");
            uploadParams.put("fetch_format", "auto");

            java.util.Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, String> result = new java.util.HashMap<>();
            result.put("url", uploadResult.get("secure_url").toString());
            result.put("publicId", uploadResult.get("public_id").toString());
            result.put("originalFilename", file.getOriginalFilename());
            result.put("format", file.getContentType());

            log.info("Image uploaded successfully: {}", result.get("url"));
            return result;
        } catch (Exception e) {
            log.error("Error uploading image", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }
}
