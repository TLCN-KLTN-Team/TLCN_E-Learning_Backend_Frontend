package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.GroupAssignmentResponse;
import com.hoangphihiep.entity.GroupAssignment;
import com.hoangphihiep.repository.GroupAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Truy vấn bài tập nhóm (UC-41) cho sinh viên đang đăng nhập.
 *
 * <p>userId lấy từ subject của JWT ({@code SecurityContextHolder...getName()}), khớp với
 * {@code memberUserIds} đã snapshot trên mỗi {@link GroupAssignment}.</p>
 */
@Service
@RequiredArgsConstructor
public class GroupAssignmentQueryService {

    private final GroupAssignmentRepository repo;

    public List<GroupAssignmentResponse> getMyGroupAssignments(Integer classId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return repo.findByClassIdAndMemberUserId(classId, userId).stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(GroupAssignmentResponse::getSubmissionDeadline,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private GroupAssignmentResponse toResponse(GroupAssignment ga) {
        return GroupAssignmentResponse.builder()
                .id(ga.getId())
                .sessionId(ga.getSessionId())
                .channelId(ga.getChannelId())
                .classId(ga.getClassId())
                .courseId(ga.getCourseId())
                .title(ga.getTitle())
                .description(ga.getDescription())
                .submissionDeadline(ga.getSubmissionDeadline())
                .crossReviewDeadline(ga.getCrossReviewDeadline())
                .maxScore(ga.getMaxScore())
                .status(ga.getEffectiveStatus())
                .finalScore(ga.getFinalScore())
                .evaluations(ga.getEvaluations() != null ? ga.getEvaluations() : List.of())
                .build();
    }
}
