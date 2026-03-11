package com.hcmute.ai_service.dto.request;

import com.hcmute.ai_service.dto.response.FlashcardDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFlashcardSetRequest {

    private String flashcardSetId;
    
    /**
     * Danh sách các flashcard cần lưu
     */
    @NotEmpty(message = "Danh sách flashcard không được để trống")
    @Valid
    private List<FlashcardDto> flashcards;
    
    /**
     * Nội dung tài liệu nội bộ được sử dụng để tạo flashcard
     */
    private String internalDocument;
    
    /**
     * Nội dung tài liệu bên ngoài (tùy chọn)
     */
    private String externalDocument;
}
