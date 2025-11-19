package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {
    private Integer id;
    private String idUser;
    private Integer courseId;
    private double progressPercentage;
    private Date startDate;
    private Date completeDate;
    private boolean isCompleted;
    private List<LessonProgressResponse> lessonProgresses;
}