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
    List<String> categories;
    List<String> levels;
    BigDecimal minPrice;
    BigDecimal maxPrice;
    Double minRating;
    String requiredPractice;
    int page;
    int size;
    String sortBy;
}
