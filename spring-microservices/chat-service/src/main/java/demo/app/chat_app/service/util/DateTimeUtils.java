package demo.app.chat_app.service.util;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

@Component
public class DateTimeUtils {

    public static Instant parseIsoToInstant(String isoString) {
        if (isoString == null || isoString.isBlank()) {
            throw new IllegalArgumentException("expiresAt is required when expirationType is DATETIME");
        }

        try {
            // Trường hợp 1: có timezone offset — "2024-11-15T10:30:00Z"
            //                                  hoặc "2024-11-15T10:30:00+07:00"
            return Instant.parse(isoString);

        } catch (DateTimeParseException e) {
            try {
                // Trường hợp 2: không có timezone — "2024-11-15T10:30:00"
                // Giả định timezone mặc định của server (hoặc UTC)
                return LocalDateTime.parse(isoString)
                        .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .toInstant();

            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException(
                        "Invalid ISO 8601 format: " + isoString
                                + ". Expected formats: "
                                + "'2024-11-15T10:30:00Z' or '2024-11-15T10:30:00+07:00' or '2024-11-15T10:30:00'");
            }
        }
    }
}
