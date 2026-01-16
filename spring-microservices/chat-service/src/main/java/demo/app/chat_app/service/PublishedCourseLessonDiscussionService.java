package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedDiscussionReadStatus;
import demo.app.chat_app.model.PublishedLessonMessage;
import demo.app.chat_app.repository.PublishedCourseDiscussionReadStatusRepository;
import demo.app.chat_app.repository.PublishedCourseLessonDiscussionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PublishedCourseLessonDiscussionService {

    private final PublishedCourseLessonDiscussionRepository discussionRepository;
    private final PublishedCourseDiscussionReadStatusRepository readStatusRepository;

    public Page<PublishedDiscussionMessageResponse> getLessonDiscussion(Integer publishedCourseId, Integer lessonId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PublishedLessonMessage> messages = discussionRepository
                .findByPublishedCourseIdAndLessonId(publishedCourseId, lessonId, pageable);

        return messages.map(this::mapToResponse);
    }

    public PublishedDiscussionMessageResponse postMessage(Integer publishedCourseId, Integer lessonId, PublishedDiscussionMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();
        String userName = request.getUserName() != null ? request.getUserName() : userId;

        PublishedLessonMessage message = PublishedLessonMessage.builder()
                .publishedCourseId(publishedCourseId)
                .lessonId(lessonId)
                .userId(userId)
                .userName(userName)
                .userAvatar(request.getUserAvatar())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .createdAt(LocalDateTime.now())
                .build();

        PublishedLessonMessage saved = discussionRepository.save(message);
        return mapToResponse(saved);
    }

    public PublishedLessonMessage getMessageById(String messageId) {
        return discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }

    public void deleteMessage(String messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedLessonMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own messages");
        }

        discussionRepository.delete(message);
    }

    public PublishedDiscussionMessageResponse toggleLike(String messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedLessonMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getLikedBy().contains(userId)) {
            message.getLikedBy().remove(userId);
            message.setLikes(message.getLikes() - 1);
        } else {
            message.getLikedBy().add(userId);
            message.setLikes(message.getLikes() + 1);
        }

        PublishedLessonMessage updated = discussionRepository.save(message);
        return mapToResponse(updated);
    }

    public Long getUnreadCount(Integer publishedCourseId, Integer lessonId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndLessonId(userId, publishedCourseId, lessonId)
                .orElse(null);

        if (readStatus == null || readStatus.getLastReadAt() == null) {
            return discussionRepository.countByPublishedCourseIdAndLessonIdAndCreatedAtAfter(
                    publishedCourseId, lessonId, LocalDateTime.MIN);
        }

        return discussionRepository.countByPublishedCourseIdAndLessonIdAndCreatedAtAfter(
                publishedCourseId, lessonId, readStatus.getLastReadAt());
    }

    public void markAsRead(Integer publishedCourseId, Integer lessonId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndLessonId(userId, publishedCourseId, lessonId)
                .orElse(PublishedDiscussionReadStatus.builder()
                        .userId(userId)
                        .publishedCourseId(publishedCourseId)
                        .lessonId(lessonId)
                        .build());

        readStatus.setLastReadAt(LocalDateTime.now());
        readStatusRepository.save(readStatus);
    }

    public Map<Integer, Long> getBatchUnreadCounts(Integer publishedCourseId, List<Integer> lessonIds) {
        Map<Integer, Long> result = new HashMap<>();
        
        for (Integer lessonId : lessonIds) {
            Long count = getUnreadCount(publishedCourseId, lessonId);
            result.put(lessonId, count);
        }
        
        return result;
    }

    private PublishedDiscussionMessageResponse mapToResponse(PublishedLessonMessage message) {
        return PublishedDiscussionMessageResponse.builder()
                .id(message.getId())
                .lessonId(message.getLessonId())
                .publishedCourseId(message.getPublishedCourseId())
                .userId(message.getUserId())
                .userName(message.getUserName())
                .userAvatar(message.getUserAvatar())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .likes(message.getLikes())
                .likedBy(message.getLikedBy())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
