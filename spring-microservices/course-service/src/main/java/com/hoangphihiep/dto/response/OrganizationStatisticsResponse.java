package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrganizationStatisticsResponse {
    Long totalOrganizations;
    Long activeOrganizations;
    Long inactiveOrganizations;
    Double growthRate; // Overall organization growth percentage
}
