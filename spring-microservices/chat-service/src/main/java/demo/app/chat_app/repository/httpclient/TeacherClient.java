package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.StudentResponse;
import demo.app.chat_app.dto.response.TeacherResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "teacherClient", url = "${services.identity.url}/teachers")
public interface TeacherClient {

    @GetMapping("/{id}")
    ApiResponse<TeacherResponse> getTeacherById(@PathVariable String id);
}
