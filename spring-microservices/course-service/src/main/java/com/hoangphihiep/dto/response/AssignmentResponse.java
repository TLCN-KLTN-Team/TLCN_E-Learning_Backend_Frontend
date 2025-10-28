package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private Integer id;

    private Integer sectionId;

    private String sectionName;

    private String title;

    private String description;

    private Date deadline;

    private List<String> assignmentFiles;

    private String submissionType;

    private List<String> rubricFiles;

    private Integer maxScore;

    private Integer numberItem;

    private Boolean isPublished;

    private Date createdAt;

    private Date updateAt;

    private Integer submissionsCount; // Số lượng bài nộp
}