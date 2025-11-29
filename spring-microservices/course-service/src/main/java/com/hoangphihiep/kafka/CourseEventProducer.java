package com.hoangphihiep.kafka;

import com.hoangphihiep.events.CourseCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventProducer {
    private final KafkaTemplate<String, CourseCreatedEvent> kafkaTemplate;

    @Value("${kafka.topic.course-events}")
    private String courseEventsTopic;

    public void publishCourseCreatedEvent(CourseCreatedEvent event) {
        log.info("Publishing course created event: {}", event);

        CompletableFuture<SendResult<String, CourseCreatedEvent>> future =
                kafkaTemplate.send(courseEventsTopic, event.getEventId(), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Event published successfully: topic={}, partition={}, offset={}",
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish event: {}", ex.getMessage());
            }
        });
    }
}
