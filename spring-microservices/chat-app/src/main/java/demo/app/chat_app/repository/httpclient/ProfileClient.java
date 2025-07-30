package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.config.InitConfig;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service", url = "http://localhost:8081/profile", configuration = InitConfig.class)
public interface ProfileClient {
    @GetMapping("/internal/users/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(@PathVariable String userId);
}
