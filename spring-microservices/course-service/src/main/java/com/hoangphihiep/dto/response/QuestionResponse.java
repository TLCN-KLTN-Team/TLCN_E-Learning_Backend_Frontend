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

    private String questionType;

    private Integer orderIndex;

    private List<String> attachments;

    private Double score;

    private Date createdAt;

    private Date updateAt;

    private Set<AnswerResponse> answers;
}
