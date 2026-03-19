package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.PublishedDiscussionMessageRequest;
import demo.app.chat_app.dto.response.PublishedDiscussionMessageResponse;
import demo.app.chat_app.model.PublishedAssignmentMessage;
import demo.app.chat_app.model.PublishedDiscussionReadStatus;
import demo.app.chat_app.repository.PublishedCourseAssignmentDiscussionRepository;
import demo.app.chat_app.repository.PublishedCourseDiscussionReadStatusRepository;
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
public class PublishedCourseAssignmentDiscussionService {

    private final PublishedCourseAssignmentDiscussionRepository discussionRepository;
    private final PublishedCourseDiscussionReadStatusRepository readStatusRepository;

    public Page<PublishedDiscussionMessageResponse> getAssignmentDiscussion(Integer publishedCourseId, Integer assignmentId, Pageable pageable) {
        Page<PublishedAssignmentMessage> messages = discussionRepository
                .findByPublishedCourseIdAndAssignmentId(publishedCourseId, assignmentId, pageable);

        return messages.map(this::mapToResponse);
    }

    public PublishedDiscussionMessageResponse postMessage(Integer publishedCourseId, Integer assignmentId, PublishedDiscussionMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();
        String userName = request.getUserName() != null ? request.getUserName() : userId;

        PublishedAssignmentMessage message = PublishedAssignmentMessage.builder()
                .publishedCourseId(publishedCourseId)
                .assignmentId(assignmentId)
                .userId(userId)
                .userName(userName)
                .userAvatar(request.getUserAvatar())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .createdAt(LocalDateTime.now())
                .build();

        PublishedAssignmentMessage saved = discussionRepository.save(message);
        return mapToResponse(saved);
    }

    public PublishedAssignmentMessage getMessageById(String messageId) {
        return discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }

    public void deleteMessage(String messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedAssignmentMessage message = discussionRepository.findById(messageId)
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

        PublishedAssignmentMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getLikedBy().contains(userId)) {
            message.getLikedBy().remove(userId);
            message.setLikes(message.getLikes() - 1);
        } else {
            message.getLikedBy().add(userId);
            message.setLikes(message.getLikes() + 1);
        }

        PublishedAssignmentMessage updated = discussionRepository.save(message);
        return mapToResponse(updated);
    }

    public Long getUnreadCount(Integer publishedCourseId, Integer assignmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndAssignmentId(userId, publishedCourseId, assignmentId)
                .orElse(null);

        if (readStatus == null || readStatus.getLastReadAt() == null) {
            return discussionRepository.countByPublishedCourseIdAndAssignmentId(
                publishedCourseId, assignmentId);
        }

        return discussionRepository.countByPublishedCourseIdAndAssignmentIdAndCreatedAtAfter(
                publishedCourseId, assignmentId, readStatus.getLastReadAt());
    }

    public void markAsRead(Integer publishedCourseId, Integer assignmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        String userId = jwt.getSubject();

        PublishedDiscussionReadStatus readStatus = readStatusRepository
                .findByUserIdAndPublishedCourseIdAndAssignmentId(userId, publishedCourseId, assignmentId)
                .orElse(PublishedDiscussionReadStatus.builder()
                        .userId(userId)
                        .publishedCourseId(publishedCourseId)
                        .assignmentId(assignmentId)
                        .build());

        readStatus.setLastReadAt(LocalDateTime.now());
        readStatusRepository.save(readStatus);
    }

    public Map<Integer, Long> getBatchUnreadCounts(Integer publishedCourseId, List<Integer> assignmentIds) {
        Map<Integer, Long> result = new HashMap<>();
        
        for (Integer assignmentId : assignmentIds) {
            Long count = getUnreadCount(publishedCourseId, assignmentId);
            result.put(assignmentId, count);
        }
        
        return result;
    }

    private PublishedDiscussionMessageResponse mapToResponse(PublishedAssignmentMessage message) {
        return PublishedDiscussionMessageResponse.builder()
                .id(message.getId())
                .assignmentId(message.getAssignmentId())
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
