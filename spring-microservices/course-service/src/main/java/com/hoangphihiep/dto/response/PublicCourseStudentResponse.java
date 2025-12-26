package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCourseStudentResponse {
    private String studentId;
    private String studentName;
    private String email;
    private LocalDateTime enrolledDate;
    private Double progress; // Phần trăm hoàn thành
    private Integer quizzesTaken; // Số bài quiz đã làm
    private Integer assignmentsSubmitted; // Số bài tập đã nộp
    private Integer lessonsCompleted;
    private Integer publishedLessons;
    private Integer publishedQuizzes;
    private Integer publishedAssignments;
    private String avatarUrl;
}
