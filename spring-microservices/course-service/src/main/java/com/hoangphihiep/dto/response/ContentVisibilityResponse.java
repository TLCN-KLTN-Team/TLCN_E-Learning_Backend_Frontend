package com.hoangphihiep.dto.response;

import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentVisibilityResponse {
    private String contentType;
    private Integer contentId;
    private String contentTitle;
    private List<ClassVisibilityInfo> classVisibilities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassVisibilityInfo {
        private Integer classId;
        private String className;
        private Boolean isVisible;
        private Date updatedAt;
    }
}