package com.hcmute.ai_service.model;

import com.hcmute.ai_service.dto.response.BaseQuestion;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

/**
 * Document MongoDB lưu một bộ quiz đã được người dùng "Lưu vào kho" sau phase
 * tạo ở AIQuizPractice. Cấu trúc giữ nguyên payload mà Python AI service trả
 * về (BaseQuestion polymorphic theo `question_type`) để khi mở lại quiz từ
 * kho tài liệu UI có thể tái sử dụng QuizEditor / QuizViewer mà không cần
 * mapping lại.
 */
@Document(collection = "quiz_sets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSet {

    @MongoId
    String id;

    /**
     * Content-based hash do client tạo (để chặn lưu trùng cùng một bộ quiz).
     */
    String quizSetId;

    String quizSetName;

    /**
     * Danh sách câu hỏi đa hình theo question_type. Lưu lại context để có thể
     * regen / xem nguồn về sau.
     */
    List<BaseQuestion> questions;

    String context;

    String externalDocument;

    String authorId;

    @Builder.Default
    String language = "vietnamese";

    @Builder.Default
    Instant createdAt = Instant.now();

    @Builder.Default
    Instant updatedAt = Instant.now();
}
