package com.hcmute.ai_service.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hcmute.ai_service.common.QuizDifficulty;
import com.hcmute.ai_service.common.QuizType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class GenerateQuizRequest {

    @NotBlank(message = "Context không được để trống")
    private String context;

    /**
     * Mới — danh sách chuẩn đầu ra người dùng tick ở Bước 1 trên UI.
     * Optional để backward-compat với endpoint /generate cũ.
     */
    @Valid
    @JsonProperty("learning_outcomes")
    private List<LearningOutcome> learningOutcomes;

    @NotEmpty(message = "Danh sách câu hỏi không được để trống")
    @Valid
    private List<QuizQuestionConfig> questions;

    /** Optional, Python side mặc định "vietnamese" nếu null. */
    private String language;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestionConfig {

        @NotNull(message = "Loại câu hỏi không được null")
        private QuizType type;

        @NotEmpty(message = "Cấu hình số lượng câu hỏi không được để trống")
        @Valid
        private List<QuestionTypeConfig> numberOfQuestions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionTypeConfig {

        @NotNull(message = "Độ khó không được null")
        private QuizDifficulty difficulty;

        @Min(value = 0, message = "Số lượng câu hỏi không được âm")
        private int number;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningOutcome {

        private String id;

        @NotBlank(message = "Title chuẩn đầu ra không được để trống")
        private String title;

        private String content;

        private String chapterId;
    }
}
