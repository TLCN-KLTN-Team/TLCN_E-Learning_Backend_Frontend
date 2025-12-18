package com.hoangphihiep.dto.request;

import com.hoangphihiep.utils.EducationType;
import com.hoangphihiep.utils.PeriodType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardFilterRequest {
    PeriodType period;
    EducationType educationType;
    LocalDate from;
    LocalDate to;
}
