package com.hoangphihiep.dto.response.user;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublishedCourseContentResponse {
    int numberSections;
    int numberLectures;
    float totalLengthOfCourse;
    List<String> sectionNames;
}
