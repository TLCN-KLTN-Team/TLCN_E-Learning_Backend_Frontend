package demo.app.chat_app.model.workspace;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

/**
 * Idempotency record cho các Kafka event đã consume thành công.
 * Lookup theo eventId (PK). Document tự xoá sau 7 ngày qua TTL index.
 *
 * Mỗi consumer trước khi xử lý sẽ check `existsById(eventId)` — nếu có
 * thì bỏ qua message, đảm bảo exactly-once tại tầng business.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "processed_events")
public class ProcessedEvent {

    @MongoId
    String eventId;

    String eventType;

    String topic;

    /** TTL index — Mongo auto-delete sau 7 ngày để collection không phình. */
    @Indexed(expireAfterSeconds = 7 * 24 * 60 * 60)
    Instant processedAt;
}
