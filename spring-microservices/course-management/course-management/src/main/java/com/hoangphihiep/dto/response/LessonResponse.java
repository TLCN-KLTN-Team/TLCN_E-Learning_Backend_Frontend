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
public class LessonResponse {

    private Integer id;

    private Integer sectionId;

    private String sectionName;

    private String title;

    private String description;

    private String content;

    private List<String> attachments;

    private String videoUrl;

    private Integer numberItem;

    private Boolean isFreeLesson;

    private Date createdAt;

    private Date updateAt;
}
