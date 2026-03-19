package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedDiscussionReadStatus;
import demo.app.chat_app.model.PublishedQuizMessage;
import demo.app.chat_app.repository.PublishedCourseDiscussionReadStatusRepository;
import demo.app.chat_app.repository.PublishedCourseQuizDiscussionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
@Slf4j
public class PublishedCourseQuizDiscussionService {

    private final PublishedCourseQuizDiscussionRepository discussionRepository;
    private final PublishedCourseDiscussionReadStatusRepository readStatusRepository;

    public Page<PublishedDiscussionMessageResponse> getQuizDiscussion(Integer publishedCourseId, Integer quizId, Pageable pageable) {
        Page<PublishedQuizMessage> messages = discussionRepository
                .findByPublishedCourseIdAndQuizId(publishedCourseId, quizId, pageable);

        return messages.map(this::mapToResponse);
    }

    public PublishedDiscussionMessageResponse postMessage(Integer publishedCourseId, Integer quizId, PublishedDiscussionMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();
        String userName = request.getUserName() != null ? request.getUserName() : userId;

        PublishedQuizMessage message = PublishedQuizMessage.builder()
                .publishedCourseId(publishedCourseId)
                .quizId(quizId)
                .userId(userId)
                .userName(userName)
                .userAvatar(request.getUserAvatar())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .createdAt(LocalDateTime.now())
                .build();

        PublishedQuizMessage saved = discussionRepository.save(message);
        return mapToResponse(saved);
    }

    public PublishedQuizMessage getMessageById(String messageId) {
        return discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }

    public void deleteMessage(String messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedQuizMessage message = discussionRepository.findById(messageId)
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

        PublishedQuizMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getLikedBy().contains(userId)) {
            message.getLikedBy().remove(userId);
            message.setLikes(message.getLikes() - 1);
        } else {
            message.getLikedBy().add(userId);
            message.setLikes(message.getLikes() + 1);
        }

        PublishedQuizMessage updated = discussionRepository.save(message);
        return mapToResponse(updated);
    }

    public Long getUnreadCount(Integer publishedCourseId, Integer quizId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndQuizId(userId, publishedCourseId, quizId)
                .orElse(null);

        if (readStatus == null || readStatus.getLastReadAt() == null) {
            return discussionRepository.countByPublishedCourseIdAndQuizId(
                publishedCourseId, quizId);
        }

        return discussionRepository.countByPublishedCourseIdAndQuizIdAndCreatedAtAfter(
                publishedCourseId, quizId, readStatus.getLastReadAt());
    }

    public void markAsRead(Integer publishedCourseId, Integer quizId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndQuizId(userId, publishedCourseId, quizId)
                .orElse(PublishedDiscussionReadStatus.builder()
                        .userId(userId)
                        .publishedCourseId(publishedCourseId)
                        .quizId(quizId)
                        .build());

        readStatus.setLastReadAt(LocalDateTime.now());
        readStatusRepository.save(readStatus);
    }

    public Map<Integer, Long> getBatchUnreadCounts(Integer publishedCourseId, List<Integer> quizIds) {
        Map<Integer, Long> result = new HashMap<>();
        
        for (Integer quizId : quizIds) {
            Long count = getUnreadCount(publishedCourseId, quizId);
            result.put(quizId, count);
        }
        
        return result;
    }

    private PublishedDiscussionMessageResponse mapToResponse(PublishedQuizMessage message) {
        return PublishedDiscussionMessageResponse.builder()
                .id(message.getId())
                .quizId(message.getQuizId())
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
