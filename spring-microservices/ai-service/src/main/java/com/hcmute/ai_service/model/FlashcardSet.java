package com.hcmute.ai_service.model;

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

@Document(collection = "flashcard_sets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardSet {
    
    @MongoId
    String id;
    
    /**
     * Danh sách các flashcard trong bộ
     */
    List<Flashcard> flashcards;
    
    /**
     * Nội dung tài liệu nội bộ được sử dụng để tạo flashcard
     */
    String internalDocument;
    
    /**
     * Nội dung tài liệu bên ngoài (tùy chọn)
     */
    String externalDocument;
    
    /**
     * ID của tác giả/người tạo bộ flashcard
     */
    String authorId;
    
    /**
     * Ngôn ngữ của flashcard
     */
    @Builder.Default
    String language = "vietnamese";
    
    /**
     * Thời gian tạo
     */
    @Builder.Default
    Instant createdAt = Instant.now();
    
    /**
     * Thời gian cập nhật cuối
     */
    @Builder.Default
    Instant updatedAt = Instant.now();
}
