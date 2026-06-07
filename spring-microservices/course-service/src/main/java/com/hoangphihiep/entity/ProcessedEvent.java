package com.hoangphihiep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;

/**
 * Idempotency record cho các Kafka event đã consume thành công ở course-service.
 *
 * Lookup theo eventId (PK). Mỗi consumer check {@code existsById(eventId)} trước khi xử lý —
 * nếu đã tồn tại thì bỏ qua message, đảm bảo exactly-once tại tầng business khi Kafka redeliver.
 */
@Entity
@Table(name = "processed_event")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedEvent implements Serializable {

    @Id
    @Column(name = "event_id", length = 100)
    private String eventId;

    @Column(name = "event_type", length = 100)
    private String eventType;

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "processed_at")
    private Instant processedAt;
}
