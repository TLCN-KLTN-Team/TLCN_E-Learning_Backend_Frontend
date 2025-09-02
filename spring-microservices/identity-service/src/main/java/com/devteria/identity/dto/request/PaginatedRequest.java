package com.devteria.identity.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PaginatedRequest {
    @Min(0)
    int page = 0;

    @Min(1) @Max(100)
    int size = 10;

    String sortBy= "createdAt"; // field to sort by
    String sortDirection = "ASC"; // ASC or DESC
}
