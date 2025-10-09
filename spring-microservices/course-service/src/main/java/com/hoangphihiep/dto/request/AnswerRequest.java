package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerRequest {

    private Integer id;

    @NotNull(message = "Question ID is required")
    private Integer questionId;

    @NotBlank(message = "Answer content is required")
    private String content;

    private Boolean isCorrect = false;

    private Integer orderIndex;

    private Date createdAt;

    private Date updateAt;
}
