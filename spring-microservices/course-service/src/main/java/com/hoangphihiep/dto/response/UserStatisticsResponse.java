package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatisticsResponse {
    Long totalUsers;
    Long studentCount;
    Long teacherCount;
    Double growthRate; // Overall user growth percentage
}
