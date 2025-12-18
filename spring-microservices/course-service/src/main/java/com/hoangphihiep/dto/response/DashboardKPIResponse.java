package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardKPIResponse {
    Long currentValue;
    Long previousValue;
    Double growthRate; // Percentage (e.g., 12.5 for 12.5%)
    
    public static DashboardKPIResponse calculate(Long current, Long previous) {
        Double growth = 0.0;
        if (previous != null && previous > 0) {
            growth = ((current - previous) * 100.0) / previous;
            // Round to 1 decimal place
            growth = Math.round(growth * 10.0) / 10.0;
        }
        return DashboardKPIResponse.builder()
                .currentValue(current)
                .previousValue(previous)
                .growthRate(growth)
                .build();
    }
}
