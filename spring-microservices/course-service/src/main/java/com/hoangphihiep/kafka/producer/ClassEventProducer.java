package com.hoangphihiep.kafka.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.events.ClassCreatedEvent;
import com.hoangphihiep.events.EnrollStudentsEvent;
import com.hoangphihiep.events.KafkaEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClassEventProducer {
    private final ObjectMapper mapper = new ObjectMapper();
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${kafka.topic.class-events}")
    private String classEventsTopic;

    public void publishClassCreatedEvent(ClassCreatedEvent event){
        publishEvent(
                classEventsTopic,
                "CLASS_CREATED",
                event.getClassId().toString(),
                event
        );
    }

    public void addMembersToClassChannel(EnrollStudentsEvent event) {
        publishEvent(
                classEventsTopic,
                "STUDENTS_ENROLLED",
                event.getClassId().toString(),
                event
        );
    }

    private <T> void publishEvent(String topic, String eventType, String key, T payload) {
        try {
            KafkaEvent<T> eventWrapper = KafkaEvent.<T>builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType(eventType)
                    .data(payload)
                    .build();

            String jsonString = mapper.writeValueAsString(eventWrapper);

            log.info("Publishing event to {}: {}", topic, jsonString);

            kafkaTemplate.send(topic, key, jsonString);

        } catch (Exception e) {
            log.error("Kafka publish error: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.KAFKA_PUBLISH_FAILED);
        }
    }
}
