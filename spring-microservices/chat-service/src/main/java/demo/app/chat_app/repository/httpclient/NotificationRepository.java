package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.dto.request.NotificationMessage;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${services.notification.url:http://localhost:8092}")
public interface NotificationRepository {
    @PostMapping("/notifications/push")
    void sendNotification(@RequestBody NotificationMessage notificationMessage);
}