package com.hcmute.ai_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSetResponse {

    private String id;
    private String name;
    private List<BaseQuestion> questions;
    private String context;
    private String externalDocument;
    private String authorId;
    private String language;
    private Instant createdAt;
    private Instant updatedAt;
    /** Số câu hỏi trong bộ — phục vụ kho tài liệu hiển thị nhanh. */
    private Integer number;
}
