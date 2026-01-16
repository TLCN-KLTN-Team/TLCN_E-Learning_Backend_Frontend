package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    private Integer id;

    private String questionText;

    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY

    private Integer orderIndex;

    private List<String> attachments;

    private Double score;

    // Library question fields
    private String difficultyLevel; // EASY, MEDIUM, HARD
    private String tags; // Comma-separated tags
    private String teacherId;
    private Integer educationalUnitId;

    private Date createdAt;

    private Date updateAt;

    private Set<AnswerResponse> answers;
}
