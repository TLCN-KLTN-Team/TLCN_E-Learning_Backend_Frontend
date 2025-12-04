package demo.app.chat_app.events;

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
    private List<Student> students;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Student {
        private String studentId;
        private String firstName;
        private String lastName;
        private String mssv;
        private String avatarUrl;
    }
}
