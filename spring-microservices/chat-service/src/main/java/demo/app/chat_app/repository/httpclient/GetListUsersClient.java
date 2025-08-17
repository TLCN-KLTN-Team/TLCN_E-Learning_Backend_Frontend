package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "getListUsersClient", url = "${services.identity.url}")
public interface GetListUsersClient {
    @GetMapping("/users/students")
    List<UserProfileResponse> getListUsers(@RequestParam String mssv);
}
