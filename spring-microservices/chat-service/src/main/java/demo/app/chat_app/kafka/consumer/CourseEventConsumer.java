package demo.app.chat_app.kafka.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.events.KafkaEvent;
import demo.app.chat_app.service.impl.EventIdempotencyService;
import demo.app.chat_app.service.impl.WorkspaceServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * Course-events consumer. Cùng pattern với {@code CourseClassEventConsumer}:
 * dedup theo eventId trước, gọi service idempotent, mark processed, manual ack.
 *
 * Backward-compat: nếu payload là raw {@link CourseCreatedEvent} (envelope-less)
 * thì fallback parse trực tiếp — dedup theo courseId (deterministic key) thay vì
 * UUID. Cho phép migration không downtime.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventConsumer {
    private final WorkspaceServiceImpl workspaceService;
    private final EventIdempotencyService idempotency;
    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(
            topics = "${kafka.topic.course-events}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "manualAckKafkaListenerContainerFactory"
    )
    public void listenCourseCreatedAndAssignForATeacher(
            String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment ack
    ) throws Exception {
        // Sniff payload: envelope hay raw event?
        JsonNode root = mapper.readTree(message);

        String eventId;
        String eventType;
        CourseCreatedEvent event;

        if (root.has("eventId") && root.has("eventType") && root.has("data")) {
            KafkaEvent<?> wrapper = mapper.readValue(message, new TypeReference<KafkaEvent<?>>() {});
            eventId = wrapper.getEventId();
            eventType = wrapper.getEventType();
            event = mapper.convertValue(wrapper.getData(), CourseCreatedEvent.class);
        } else {
            // Legacy payload: derive deterministic dedup key from courseId.
            event = mapper.readValue(message, CourseCreatedEvent.class);
            eventType = "COURSE_CREATED";
            eventId = "legacy-course-" + (event.getCourseId() != null ? event.getCourseId() : "unknown");
        }

        if (idempotency.isProcessed(eventId)) {
            log.info("Skipping already-processed course event {} (type={})", eventId, eventType);
            ack.acknowledge();
            return;
        }

        log.info("Processing {} event {} courseId={}", eventType, eventId, event.getCourseId());
        workspaceService.createWorkspaceWhenCourseCreatedAndAssignForATeacher(event);

        idempotency.markProcessed(eventId, eventType, topic);
        ack.acknowledge();
    }
}
