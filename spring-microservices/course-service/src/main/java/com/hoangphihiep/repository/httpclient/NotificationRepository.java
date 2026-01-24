package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.dto.request.NotificationMessage;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.hoangphihiep.config.FeignClientConfig;

@FeignClient(name = "notification-service", url = "${app.services.notification}", configuration = FeignClientConfig.class)
public interface NotificationRepository {
    @PostMapping("/api/v1/notifications/push")
    void sendNotification(@RequestBody NotificationMessage notificationMessage);
}
