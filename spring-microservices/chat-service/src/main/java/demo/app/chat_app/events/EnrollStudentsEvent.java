package demo.app.chat_app.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Event khi students enroll vào class
 * Chứa đầy đủ student info để không cần gọi API
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollStudentsEvent {
    private Integer courseId;
    private Integer classId;

    @Deprecated // Backward compatible, nên dùng students
    private List<String> studentIds;

    // Full student info từ course-service
    private List<StudentInfo> students;
}
