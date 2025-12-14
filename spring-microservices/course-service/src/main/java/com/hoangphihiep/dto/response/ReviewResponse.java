package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {
    Integer id;
    Integer rate;
    String content;
    Integer courseId;
    String courseName;
    String createdById;
    String createdByName;
    String createdByAvatar;
    Date createdAt;
}
