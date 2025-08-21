package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {

    private Integer id;

    private String content;

    private Boolean isCorrect;

    private Integer orderIndex;

    private Date createdAt;

    private Date updateAt;
}
