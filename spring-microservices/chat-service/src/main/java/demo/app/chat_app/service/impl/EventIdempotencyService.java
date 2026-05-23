package demo.app.chat_app.service.impl;

import demo.app.chat_app.model.workspace.ProcessedEvent;
import demo.app.chat_app.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Lưu/kiểm tra eventId đã consume xong để tránh xử lý lại khi Kafka redeliver.
 * Pattern: consumer check {@link #isProcessed} ở đầu, gọi {@link #markProcessed} sau khi
 * business logic hoàn tất.
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
     * Idempotent insert — nếu eventId đã tồn tại do race condition (2 listener cùng
     * group bị fan-out song song) thì swallow {@link DuplicateKeyException}.
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
        } catch (DuplicateKeyException ignored) {
            log.debug("Event {} already marked processed concurrently", eventId);
        }
    }
}
