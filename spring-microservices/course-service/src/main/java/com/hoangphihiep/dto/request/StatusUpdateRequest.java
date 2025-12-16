package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequest {
    private String status;
    private String reason;
    private String unitName;
    private String representativeEmail;
    private Integer unitId;
}
