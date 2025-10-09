package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class LessonRequest {

    private Integer id;

    @NotNull(message = "Section ID is required")
    private Integer sectionId;

    @NotBlank(message = "Lesson title is required")
    private String title;

    private String description;

    private String content;

    private List<String> attachments;

    private String videoUrl;


    private Integer numberItem;

    private Boolean isFreeLesson = false;

    private Date createdAt;

    private Date updateAt;
}
