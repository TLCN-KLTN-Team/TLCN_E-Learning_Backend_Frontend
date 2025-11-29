package com.hoangphihiep.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaProducerConfig {

    private static final String COURSE_CREATED_TOPIC = "course.created";

    @Bean
    public NewTopic courseCreatedTopic() {
        return TopicBuilder
                .name(COURSE_CREATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
