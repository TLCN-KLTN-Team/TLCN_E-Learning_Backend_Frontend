package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.config.AuthenticationRequestInterceptor;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.UserProfileResponse;
import demo.app.chat_app.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "getUserClient", url = "${services.identity.url}",
    configuration = {AuthenticationRequestInterceptor.class}
)
public interface GetUserClient {
    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId);

    @GetMapping("/users/by-role")
    ApiResponse<java.util.List<UserResponse>> getUsersByRole(@RequestParam String role);
}
