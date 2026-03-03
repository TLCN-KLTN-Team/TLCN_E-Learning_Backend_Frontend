package com.hcmute.ai_service.dto.request;

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
    
    @NotEmpty(message = "Danh sách câu hỏi không được để trống")
    @Valid
    private List<QuizQuestionConfig> questions;

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
        
        @Min(value = 1, message = "Số lượng câu hỏi phải lớn hơn 0")
        private int number;
    }
}
