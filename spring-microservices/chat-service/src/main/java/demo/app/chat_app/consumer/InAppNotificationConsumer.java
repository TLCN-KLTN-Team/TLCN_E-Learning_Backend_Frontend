package demo.app.chat_app.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class InAppNotificationConsumer {

    @RabbitListener(queues = "${rabbitmq.queue.edu-unit-queue}")
    public void consumeEduUnitRegister(String message) {
        // Xử lý tin nhắn nhận được từ RabbitMQ
        System.out.println("Received message: " + message);
        // Thực hiện các hành động cần thiết với tin nhắn, ví dụ: lưu vào cơ sở dữ liệu, gửi thông báo, v.v.
    }
}
