package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherResponse {
    private String id;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String dob;

    private String teacherId;

    private String departmentId;

    private String educationalUnitId;

    private String description;

    private String socialUrl;

    private String bankAccountNumber;

    private String accountStatus;

    private String avatarUrl;

    private String phoneNumber;

    private String bio;
}
