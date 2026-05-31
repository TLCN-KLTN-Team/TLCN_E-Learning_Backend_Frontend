package demo.app.chat_app.kafka.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.events.KafkaEvent;
import demo.app.chat_app.service.impl.ChannelServiceImpl;
import demo.app.chat_app.service.impl.EventIdempotencyService;
import demo.app.chat_app.service.impl.SectionServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * Class-events consumer.
 *
 * Pattern:
 *   1. Parse {@link KafkaEvent} envelope → lấy eventId.
 *   2. {@link EventIdempotencyService#isProcessed(String)} → nếu rồi: ack & bỏ qua.
 *   3. Gọi service xử lý (đã idempotent ở data layer).
 *   4. {@link EventIdempotencyService#markProcessed(String, String, String)}.
 *   5. Manual ack.
 *
 * Lỗi ở bước 3 → KHÔNG ack → Kafka retry. DefaultErrorHandler (xem KafkaConsumerConfig)
 * sẽ backoff & cuối cùng publish sang DLT thay vì kẹt poison-pill.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseClassEventConsumer {
    private final ObjectMapper mapper = new ObjectMapper();
    private final ChannelServiceImpl channelService;
    private final SectionServiceImpl sectionService;
    private final EventIdempotencyService idempotency;

    @KafkaListener(
            topics = "${kafka.topic.class-events}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "manualAckKafkaListenerContainerFactory"
    )
    public void listenCourseClassEvents(
            String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment ack
    ) throws Exception {
        KafkaEvent<?> wrapper = mapper.readValue(
                message,
                new TypeReference<KafkaEvent<?>>() {}
        );

        String eventId = wrapper.getEventId();
        String eventType = wrapper.getEventType();

        if (idempotency.isProcessed(eventId)) {
            log.info("Skipping already-processed class event {} (type={})", eventId, eventType);
            ack.acknowledge();
            return;
        }

        JsonNode data = mapper.valueToTree(wrapper.getData());

        switch (eventType) {
            case "CLASS_CREATED" -> {
                log.info("Received CLASS_CREATED event {}: {}", eventId, data);
                ClassCreatedEvent classCreatedEvent = mapper.convertValue(data, ClassCreatedEvent.class);
                sectionService.createSectionWhenClassCreated(classCreatedEvent);
            }
            case "STUDENTS_ENROLLED" -> {
                log.info("Received STUDENTS_ENROLLED event {}: {}", eventId, data);
                EnrollStudentsEvent enrollStudentsEvent = mapper.convertValue(data, EnrollStudentsEvent.class);
                channelService.addParticipantsWhenStudentsEnrolled(enrollStudentsEvent);
            }
            default -> {
                log.warn("Unknown class event type: {} (eventId={})", eventType, eventId);
                ack.acknowledge();
                return;
            }
        }

        idempotency.markProcessed(eventId, eventType, topic);
        ack.acknowledge();
    }
}
