package com.hoangphihiep.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SearchFiltersRequest {
    String keyword;
    Double minRating;
    String category;
    List<String> practiceTypes;
    List<String> fees;
    List<String> durations;
    int page;
    int size;
    String sortBy;
}
