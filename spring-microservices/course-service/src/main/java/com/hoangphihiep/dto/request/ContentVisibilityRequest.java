package com.hoangphihiep.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentVisibilityRequest {
    private String contentType; // "SECTION", "LESSON", "QUIZ", "ASSIGNMENT"
    private Integer contentId;
    private List<Integer> visibleClassIds; // Danh sách ID lớp được xem
}