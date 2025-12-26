package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDistributionResponse {
    private long totalUsers;
    private long adminUsers;
    private long instructorUsers;
    private long studentUsers;
}
