package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class EnrolledCourseQuizResponse {
    Set<SectionRes> sections;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionRes {
        private Integer sectionId;
        private String title;
        private Set<QuizRes> quizzes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizRes {
        private Integer quizId;
        private String title;
        private int durationMinutes;
        private int numberItems;
        private double passingScore;
        private Integer sectionId;
        private Set<QuestionRes> questions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRes {
        private Integer questionId;
        private String content;
        private String questionText;
        private String questionType;
        private int score;
        private Integer quizId;
        private Set<AnswerRes> answers; // Sửa lại từ sections
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRes {
        private Integer answerId;
        private String content;
        private boolean isCorrect;
        private Integer questionId;
    }
}