package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Event khi students enroll vào class
 * Chứa đầy đủ student info để chat-service không cần gọi API
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollStudentsEvent {
    private Integer courseId;
    private Integer classId;

    @Deprecated // Giữ lại để backward compatible, nhưng nên dùng students
    private List<String> studentIds;

    // New field chứa đầy đủ student info
    private List<StudentInfo> students;
}
