package demo.app.chat_app.kafka;

import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.service.WorkspaceService;
import demo.app.chat_app.service.impl.WorkspaceServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventConsumer {
    private final WorkspaceServiceImpl workspaceService;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @KafkaListener(
            topics = "${kafka.topic.course-events}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeCourseCreatedEvent(
            @Payload CourseCreatedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("=== KAFKA CONSUMER TRIGGERED ===");
        log.info("Received CourseCreatedEvent from partition {} offset {}: courseId={}",
                partition, offset, event.getCourseId());
        log.info("Event details: {}", event);

        try {
            // Xử lý event và tạo workspace
            workspaceService.createWorkspaceWhenCourseCreated(event);
            log.info("Successfully created workspace for course: {}", event.getCourseId());

        } catch (Exception e) {
            log.error("Error processing CourseCreatedEvent for courseId {}: {}",
                    event.getCourseId(), e.getMessage(), e);

            // MongoDB errors có thể là:
            // - DuplicateKeyException: courseId already exists
            // - Connection issues
            // - Validation errors

            // Strategy: Log và throw để Kafka retry
            throw new RuntimeException("Failed to process event", e);
        }
    }
}
