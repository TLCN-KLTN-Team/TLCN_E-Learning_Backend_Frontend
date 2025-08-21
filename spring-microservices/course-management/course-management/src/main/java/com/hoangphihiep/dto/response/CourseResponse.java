package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private Integer id;
    private String courseName;
    private CourseTypeResponse courseType;
    private Double coursePrice;
    private Boolean visibility;
    private Date publishedAt;
    private Date createdAt;
    private Date updatedAt;
    private Boolean isApproved;
    private String idTeacher;
    private Integer status;
    private Set<SectionResponse> sections;
    private Integer reviewsCount;
}
