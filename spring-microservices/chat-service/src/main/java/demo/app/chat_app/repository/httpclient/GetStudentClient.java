package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.config.AuthenticationRequestInterceptor;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.StudentResponse;
import demo.app.chat_app.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "getStudentClient", url = "${services.identity.url}",
    configuration = {AuthenticationRequestInterceptor.class}
)
public interface GetStudentClient {
    @PostMapping("/students/students-by-user-ids")
    ApiResponse<List<StudentResponse>> getStudentsByUserIds(
            @RequestBody Map<String, List<String>> request
    );

    @GetMapping("/students/by-user-id/{id}")
    ApiResponse<StudentResponse> getStudentByUserId(@PathVariable String id);
}
