package com.hoangphihiep.kafka.producer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.events.CourseCreatedEvent;
import com.hoangphihiep.events.EnrollStudentsEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${kafka.topic.course-events}")
    private String courseEventsTopic;

    private final ObjectMapper mapper;

    public void publishCourseCreatedEvent(CourseCreatedEvent event) throws JsonProcessingException {
        log.info("Publishing course created event: {}", event);
        String jsonString = mapper.writeValueAsString(event);

        kafkaTemplate.send(courseEventsTopic, jsonString);
    }

}
