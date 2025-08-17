package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "getUserClient", url = "${services.identity.url}")
public interface GetUserClient {
    @GetMapping("/users/{userId}")
    ApiResponse<UserProfileResponse> getUser(@PathVariable String userId);
}
