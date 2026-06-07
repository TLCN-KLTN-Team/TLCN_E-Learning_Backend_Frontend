package demo.app.chat_app.kafka.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.dto.event.AssignmentSessionCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Publish event "ASSIGNMENT_SESSION_CREATED" sang course-service khi giáo viên tạo phiên bài tập nhóm.
 *
 * <p>Dùng chung topic {@code score-events} và cùng key = sessionId với SCORE_CALCULATED để course-service
 * xử lý tuần tự per-phiên (tạo bản ghi trước, ghi điểm sau). Best-effort: lỗi publish chỉ log, không
 * làm fail giao dịch tạo phiên (course-service vẫn tự upsert được khi SCORE_CALCULATED tới).</p>
 */
@Slf4j
@Component
public class AssignmentSessionEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String scoreEventsTopic;

    public AssignmentSessionEventPublisher(
            @Qualifier("scoreKafkaTemplate") KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${kafka.topic.score-events}") String scoreEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.scoreEventsTopic = scoreEventsTopic;
    }

    public void publishSessionCreated(AssignmentSessionCreatedEvent data) {
        if (data == null || data.getSessionId() == null) {
            return;
        }
        try {
            Map<String, Object> envelope = new HashMap<>();
            envelope.put("eventId", UUID.randomUUID().toString());
            envelope.put("eventType", "ASSIGNMENT_SESSION_CREATED");
            envelope.put("data", data);

            String json = objectMapper.writeValueAsString(envelope);
            kafkaTemplate.send(scoreEventsTopic, data.getSessionId(), json);

            log.info("Published ASSIGNMENT_SESSION_CREATED event for session {} ({} groups)",
                    data.getSessionId(), data.getGroups() != null ? data.getGroups().size() : 0);
        } catch (Exception e) {
            log.error("Failed to publish ASSIGNMENT_SESSION_CREATED for session {}: {}",
                    data.getSessionId(), e.getMessage());
        }
    }
}
