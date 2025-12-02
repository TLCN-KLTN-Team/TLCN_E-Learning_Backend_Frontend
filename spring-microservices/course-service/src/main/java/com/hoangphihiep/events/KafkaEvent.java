package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KafkaEvent<T> {
    private String eventId;
    private String eventType;
    private T data;
}
