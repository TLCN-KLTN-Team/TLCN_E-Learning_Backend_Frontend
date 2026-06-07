package com.hoangphihiep.service;

import com.hoangphihiep.entity.ProcessedEvent;
import com.hoangphihiep.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Lưu/kiểm tra eventId đã consume xong để tránh xử lý lại khi Kafka redeliver.
 *
 * Pattern: consumer check {@link #isProcessed} ở đầu, gọi {@link #markProcessed} sau khi
 * business logic hoàn tất. Mirror {@code EventIdempotencyService} của chat-service nhưng
 * lưu xuống MySQL (course-service) thay vì MongoDB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EventIdempotencyService {

    private final ProcessedEventRepository repository;

    public boolean isProcessed(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return false;
        }
        return repository.existsById(eventId);
    }

    /**
     * Idempotent insert — nếu eventId đã tồn tại do race condition (delivery song song)
     * thì swallow {@link DataIntegrityViolationException}.
     */
    public void markProcessed(String eventId, String eventType, String topic) {
        if (eventId == null || eventId.isBlank()) {
            return;
        }
        try {
            repository.save(ProcessedEvent.builder()
                    .eventId(eventId)
                    .eventType(eventType)
                    .topic(topic)
                    .processedAt(Instant.now())
                    .build());
        } catch (DataIntegrityViolationException ignored) {
            log.debug("Event {} already marked processed concurrently", eventId);
        }
    }
}
