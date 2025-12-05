package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollStudentsEvent {
    private String eventId;
    private Integer courseId;
    private Integer classId;
    private List<String> studentIds;
}
