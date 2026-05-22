package com.hcmute.ai_service.dto.request;

import com.hcmute.ai_service.dto.response.BaseQuestion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload từ UI khi học viên nhấn "Lưu" ở phase tạo quiz của AIQuizPractice.
 * Giữ nguyên payload đa hình của BaseQuestion để có thể mở lại quiz đã lưu
 * mà không phải mapping ngược.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveQuizSetRequest {

    /** Content-based hash từ FE để chặn lưu trùng. */
    private String quizSetId;

    /** Tên hiển thị do FE tự đặt (theo chương đã chọn) — optional. */
    private String quizSetName;

    @NotEmpty(message = "Danh sách câu hỏi không được để trống")
    @Valid
    private List<BaseQuestion> questions;

    /** Context đã gửi cho AI khi sinh ra bộ quiz này. */
    private String context;

    private String externalDocument;

    @NotBlank(message = "ID tác giả không được để trống")
    private String authorId;

    @Builder.Default
    private String language = "vietnamese";
}
