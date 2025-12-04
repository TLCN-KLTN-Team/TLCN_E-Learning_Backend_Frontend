package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateReviewRequest {
    @NotNull(message = "RATE_REQUIRED")
    @Min(value = 1, message = "RATE_MIN")
    @Max(value = 5, message = "RATE_MAX")
    Integer rate;

    @NotNull(message = "CONTENT_REQUIRED")
    @Size(min = 3, max = 1000, message = "CONTENT_SIZE")
    String content;
}
