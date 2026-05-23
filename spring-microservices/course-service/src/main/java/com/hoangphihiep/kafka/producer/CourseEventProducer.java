package com.hoangphihiep.kafka.producer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.events.CourseCreatedEvent;
import com.hoangphihiep.events.KafkaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Publishes course-level lifecycle events.
 *
 * Toàn bộ event được wrap trong {@link KafkaEvent} với eventId duy nhất để
 * consumer (chat-service) dedup khi Kafka redeliver.
 *
 * Key = courseId — Kafka đảm bảo cùng course đi cùng partition, giữ thứ tự
 * CourseCreated → ClassCreated → StudentsEnrolled khi nằm cùng topic. Khác
 * topic vẫn cần consumer chịu được "ClassCreated đến trước Workspace tồn tại"
 * (xử lý: throw → Kafka retry với backoff).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${kafka.topic.course-events}")
    private String courseEventsTopic;

    private final ObjectMapper mapper;

    public void publishCourseCreatedEvent(CourseCreatedEvent event) throws JsonProcessingException {
        KafkaEvent<CourseCreatedEvent> wrapper = KafkaEvent.<CourseCreatedEvent>builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("COURSE_CREATED")
                .data(event)
                .build();
        String jsonString = mapper.writeValueAsString(wrapper);
        String key = event.getCourseId() != null ? event.getCourseId().toString() : null;

        log.info("Publishing COURSE_CREATED to {}: eventId={}, key={}",
                courseEventsTopic, wrapper.getEventId(), key);
        kafkaTemplate.send(courseEventsTopic, key, jsonString);
    }
}
