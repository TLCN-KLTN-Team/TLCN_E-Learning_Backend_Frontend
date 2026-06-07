package com.hoangphihiep.kafka.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.events.AssignmentSessionCreatedEvent;
import com.hoangphihiep.events.KafkaEvent;
import com.hoangphihiep.events.ScoreCalculatedEvent;
import com.hoangphihiep.service.CrossReviewScoreGradingService;
import com.hoangphihiep.service.EventIdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * Consume {@code score-events} từ chat-service (event SCORE_CALCULATED) và ghi điểm chấm
 * chéo nhóm vào gradebook LMS.
 *
 * Cùng pattern với consumer của chat-service: dedup theo eventId trước, gọi service ghi
 * điểm (idempotent ở cấp event), mark processed, rồi manual ack. Lỗi không ack → Kafka
 * retry với backoff rồi đẩy sang DLT (cấu hình ở {@code KafkaConsumerConfig}).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ScoreEventConsumer {

    private static final String TYPE_SESSION_CREATED = "ASSIGNMENT_SESSION_CREATED";

    private final CrossReviewScoreGradingService scoreGradingService;
    private final EventIdempotencyService idempotency;
    /**
     * ObjectMapper do Spring Boot auto-config — đã đăng ký JavaTimeModule (JSR-310) nên parse được
     * field {@code Instant} (submissionDeadline/crossReviewDeadline) trong event. KHÔNG tự
     * {@code new ObjectMapper()}: bản trần thiếu module này → ném IllegalArgumentException khi gặp Instant.
     */
    private final ObjectMapper mapper;

    @KafkaListener(
            topics = "${kafka.topic.score-events}",
            groupId = "${spring.kafka.consumer.group-id:course-service-group}",
            containerFactory = "manualAckKafkaListenerContainerFactory"
    )
    public void listenScoreEvents(
            String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment ack
    ) throws Exception {
        JsonNode root = mapper.readTree(message);

        String eventId;
        String eventType;
        JsonNode data;

        if (root.has("eventId") && root.has("eventType") && root.has("data")) {
            KafkaEvent<?> wrapper = mapper.readValue(message, new TypeReference<KafkaEvent<?>>() {});
            eventId = wrapper.getEventId();
            eventType = wrapper.getEventType();
            data = root.get("data");
        } else {
            // Backward-compat: payload raw (envelope-less) — coi như SCORE_CALCULATED, dedup theo sessionId.
            eventType = "SCORE_CALCULATED";
            data = root;
            String sessionId = root.path("sessionId").asText(null);
            eventId = "legacy-score-" + (sessionId != null ? sessionId : "unknown");
        }

        if (idempotency.isProcessed(eventId)) {
            log.info("Bỏ qua event đã xử lý {} (type={})", eventId, eventType);
            ack.acknowledge();
            return;
        }

        if (TYPE_SESSION_CREATED.equals(eventType)) {
            AssignmentSessionCreatedEvent event =
                    mapper.convertValue(data, AssignmentSessionCreatedEvent.class);
            log.info("Xử lý {} event {} session={} class={}",
                    eventType, eventId, event.getSessionId(), event.getClassId());
            scoreGradingService.createGroupAssignments(event);
        } else {
            ScoreCalculatedEvent event = mapper.convertValue(data, ScoreCalculatedEvent.class);
            log.info("Xử lý {} event {} session={} class={}",
                    eventType, eventId, event.getSessionId(), event.getClassId());
            scoreGradingService.applyCrossReviewScores(event);
        }

        idempotency.markProcessed(eventId, eventType, topic);
        ack.acknowledge();
    }
}
