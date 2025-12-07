package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassCreatedEvent {
    private String eventId;
    private Integer courseId;
    private Integer classId;
    private String className;
    private String classCode;
    private String description;
    private boolean isPrivate;
    private String createdAt;
    private String endedAt;
}
